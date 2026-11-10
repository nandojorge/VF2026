const SHEETS = ['entradas','contactos','leads','acoes','notasleads','negocios','sessoes','pagamentos','listafisioterapeutas'];

const str=v=>String(v??'').trim();
const low=v=>str(v).toLowerCase();
const truthy=v=>['1','true','sim','yes','fechado','fechada','pago'].includes(low(v));
const normCode=v=>str(v).replace(/^([0-9]+)\.0+$/,'$1');
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateOnly=v=>{
  const x=str(v);
  const m=x.match(/(\d{4}-\d{2}-\d{2})/);
  if(m)return m[1];
  const d=new Date(x);
  return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):'';
};
const cents=v=>{
  let x=str(v).replace(/\s/g,'').replace(/€/g,'');
  if(!x)return 0;
  if(x.includes(',')&&x.includes('.')) x=x.lastIndexOf(',')>x.lastIndexOf('.')?x.replace(/\./g,'').replace(',','.'):x.replace(/,/g,'');
  else if(x.includes(',')) x=x.replace(',','.');
  x=x.replace(/[^0-9.-]/g,'');
  const n=Number(x);
  return Number.isFinite(n)?Math.max(0,Math.round(n*100)):0;
};
const slug=v=>'p_'+str(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const safe=(p,v,row)=>p+'_'+(normCode(v)||'row_'+row);
const channel=(id,kind,value,preferred=true)=>({id,kind,value:str(value),preferred,owner:'self',invalid:false});

async function fetchRows(supabase,runId,meta,name){
  const m=meta[name]; if(!m)return [];
  let out=[],from=0;
  while(true){
    const {data,error}=await supabase.from('sheet_sync_rows')
      .select('source_row,values_json')
      .eq('sync_run_id',runId).eq('sheet_name',name)
      .order('source_row',{ascending:true}).range(from,from+999);
    if(error)throw error;
    for(const r of data||[]){
      const o={};
      (m.headers||[]).forEach((h,i)=>{ if(str(h)) o[str(h)]=r.values_json?.[i]??''; });
      out.push({sourceRow:r.source_row,data:o});
    }
    if(!data||data.length<1000)break;
    from+=1000;
  }
  return out;
}

export async function loadVivusRealState(supabase,base){
  const {data:sync,error:syncErr}=await supabase.from('sheet_sync_state')
    .select('current_run_id,last_success_at').eq('singleton',true).single();
  if(syncErr)throw syncErr;
  if(!sync.current_run_id)throw new Error('Não existe uma sincronização ativa.');

  const {data:metas,error:metaErr}=await supabase.from('sheet_sync_sheets')
    .select('sheet_name,headers,row_count,column_count').eq('sync_run_id',sync.current_run_id);
  if(metaErr)throw metaErr;
  const meta={}; for(const m of metas||[])meta[m.sheet_name]=m;

  const loaded=await Promise.all(SHEETS.map(async name=>[name,await fetchRows(supabase,sync.current_run_id,meta,name)]));
  const raw=Object.fromEntries(loaded);

  const professionals=[];
  const proByName=new Map();
  for(const r of raw.listafisioterapeutas||[]){
    const name=str(r.data.fisioterapeuta); if(!name)continue;
    const id=slug(name)||safe('p',name,r.sourceRow);
    if(proByName.has(low(name)))continue;
    const p={id,name,active:low(r.data.ativas)!=='nao',internal:/ana pereira/i.test(name),feeTableId:null};
    professionals.push(p); proByName.set(low(name),id);
  }
  if(!proByName.has('ana pereira')){professionals.unshift({id:'p_ana_pereira',name:'Ana Pereira',active:true,internal:true,feeTableId:null});proByName.set('ana pereira','p_ana_pereira');}
  const pAna=proByName.get('ana pereira');

  const contacts=[],contactByCode=new Map();
  for(const r of raw.contactos||[]){
    const x=r.data,code=normCode(x.codigocontacto); if(!code)continue;
    const id=contactByCode.has(code)?safe('cdup',code,r.sourceRow):'c_'+code;
    if(!contactByCode.has(code))contactByCode.set(code,id);
    const channels=[];
    if(str(x.telefone))channels.push(channel(id+'_phone','phone',x.telefone,true));
    if(str(x.email))channels.push(channel(id+'_email','email',x.email,!channels.length));
    contacts.push({
      id,name:str(x.nome)||('Contacto '+code),channels,city:str(x.concelho),country:'PT',
      birthDate:dateOnly(x.datadenascimento),archived:low(x.arquivado)==='sim',
      commercialRestrictions:[],createdAt:dateOnly(x.dataregisto)||today(),legacyCode:code,sourceRow:r.sourceRow
    });
  }

  const leads=[],leadByCode=new Map();
  for(const r of raw.leads||[]){
    const x=r.data,code=normCode(x.codigolead),cc=normCode(x.codigocontacto); if(!code||!contactByCode.has(cc))continue;
    const id=leadByCode.has(code)?safe('ldup',code,r.sourceRow):'l_'+code;
    if(!leadByCode.has(code))leadByCode.set(code,id);
    const closed=/fech|encerr/i.test(low(x.estadodalead))||low(x.arquivado)==='sim';
    const converted=/convertida/i.test(str(x.conversao));
    let status=converted?'Convertida':closed?'Não Convertida':'Em Contacto';
    if(!closed&&/marc/i.test(low(x.interesse)))status='Em Marcação';
    leads.push({
      id,contactId:contactByCode.get(cc),brand:'VivusFisio',responsibleId:pAna,status,closed,
      closeReason:closed?str(x.motivonaoavaliacao):'',createdAt:dateOnly(x.datacontactolead)||today(),
      origin:{source:'Histórico Sheets',campaign:''},history:[],notes:[],legacyCode:code,sourceRow:r.sourceRow
    });
  }

  for(const r of raw.notasleads||[]){
    const x=r.data,lc=normCode(x.codigolead),lid=leadByCode.get(lc); if(!lid)continue;
    const l=leads.find(z=>z.id===lid); if(!l)continue;
    const note=str(x.nota); if(!note)continue;
    l.notes.push({id:safe('n',x.codigonotas,r.sourceRow),at:(dateOnly(x.datanota)||today())+'T12:00:00Z',author:'Histórico',text:note,original:true,source:'sheets',entryId:null});
  }

  const rawSessionCount=new Map();
  for(const r of raw.sessoes||[]){
    const dc=normCode(r.data.codigonegocios); if(dc)rawSessionCount.set(dc,(rawSessionCount.get(dc)||0)+1);
  }
  const parseCredits=(label,count)=>{
    const m=str(label).match(/pack\s*(\d+)/i); if(m)return Math.max(Number(m[1]),count||0);
    if(/avalia|sess[aã]o\s*indv|individual/i.test(str(label)))return Math.max(1,count||0);
    return Math.max(1,count||0);
  };
  const deals=[],dealByCode=new Map();
  for(const r of raw.negocios||[]){
    const x=r.data,code=normCode(x.codigonegocios),lc=normCode(x.codigolead); if(!code||!leadByCode.has(lc))continue;
    const id=dealByCode.has(code)?safe('ddup',code,r.sourceRow):'d_'+code;
    if(!dealByCode.has(code))dealByCode.set(code,id);
    const label=str(x.negocio)||str(x.servico)||('Negócio '+code), lower=low(label);
    const kind=/avalia/.test(lower)?'assessment':/pack|mensalidade|classe/.test(lower)?'pack':'session';
    const prof=proByName.get(low(x.fisioterapeuta))||pAna;
    deals.push({
      id,leadId:leadByCode.get(lc),brand:'VivusFisio',product:label,label,kind,totalCents:cents(x.valor),
      credits:parseCredits(label,rawSessionCount.get(code)||0),acceptedAt:dateOnly(x.data)||dateOnly(x.dataregisto)||today(),
      cancelled:!!str(x.cancelado)&&!['0','false','nao','não'].includes(low(x.cancelado)),
      followupClosed:truthy(x.fechado)||/terminado/i.test(str(x.estadonegocio)),
      sellerId:prof,professionalId:prof,zone:str(x.concelho)||'Norte',valueAdjustments:[],notes:[],
      legacyCode:code,sourceRow:r.sourceRow
    });
  }

  const sessions=[];
  for(const r of raw.sessoes||[]){
    const x=r.data,dc=normCode(x.codigonegocios),cc=normCode(x.codigocontacto),dealId=dealByCode.get(dc),contactId=contactByCode.get(cc);
    const date=dateOnly(x.data); if(!dealId||!contactId||!date)continue;
    const st=low(x.estadosessao),status=/cancel/.test(st)?'Cancelada':truthy(x.fechada)||/fech|realiz/.test(st)?'Realizada':'Confirmada';
    sessions.push({
      id:safe('s',x.codigosessao,r.sourceRow),dealId,leadId:leadByCode.get(normCode(x.codigolead))||deals.find(d=>d.id===dealId)?.leadId,
      contactId,brand:'VivusFisio',date,time:str(x.horasessao)||'00:00',status,
      type:/avalia/i.test(str(x.negocio))?'Avaliação':'Tratamento',
      physioId:proByName.get(low(x.fisioterapeuta))||pAna,note:'',scheduleHistory:[],chargeCredit:false,
      completedAt:status==='Realizada'?date+'T12:00:00Z':null,legacyCode:normCode(x.codigosessao),sourceRow:r.sourceRow
    });
  }

  const payments=[];
  for(const r of raw.pagamentos||[]){
    const x=r.data,dc=normCode(x.codigonegocios),dealId=dealByCode.get(dc),value=cents(x.valor); if(!dealId||value<=0)continue;
    payments.push({
      id:safe('pmt',x.codigopagamentos,r.sourceRow),dealId,amountCents:value,date:dateOnly(x.datapagamento)||today(),
      kind:'receipt',account:str(x.conta),invoiceRequired:!!str(x.fatura)||!!str(x.numerofatura),
      invoiceNumber:str(x.numerofatura),expenseId:str(x.iddespesa),reference:str(x.itp),note:'',voided:false,sourceRow:r.sourceRow
    });
  }

  const actions=[];
  for(const r of raw.acoes||[]){
    const x=r.data,cc=normCode(x.codigocontacto),cid=contactByCode.get(cc); if(!cid)continue;
    const due=dateOnly(x.dataaco)||dateOnly(x.data)||today();
    const status=/fech|conclu/i.test(low(x.estado))?'Concluída':/cancel/.test(low(x.estado))?'Cancelada':'Pendente';
    actions.push({
      id:safe('a',x.codigoacao,r.sourceRow),title:str(x.acao)||'Ação',type:str(x.acao)||'Seguimento',dueDate:due,
      responsibleId:pAna,status,target:{type:'contact',id:cid},note:'',result:status==='Concluída'?'Histórico Sheets':'',
      sourceRow:r.sourceRow
    });
  }

  const entries=[];
  for(const r of raw.entradas||[]){
    const x=r.data,code=normCode(x.codigoentrada)||String(r.sourceRow);
    const registered=low(x.registado)==='sim';
    const discarded=/spam|teste|descart/i.test(low(x.lead_status));
    entries.push({
      id:'e_'+code,externalId:str(x.id)||str(x.codigoentrada)||null,brand:str(x.marca)||'VivusFisio',
      source:str(x.origemcontacto)||str(x.platform)||'Formulário',receivedAt:str(x.data)||today()+'T12:00:00Z',
      state:discarded?'discarded':registered?'processed':'pending',reviewedValid:registered&&!discarded,
      senderName:str(x.nomecompleto)||str(x.full_name)||[str(x.nome),str(x.apelido)].filter(Boolean).join(' '),
      phone:str(x.telefone)||str(x.phone_number),email:str(x.email),social:'',
      message:str(x.nota),campaign:str(x.campaign_name),ids:{ad_id:str(x.ad_id),campaign_id:str(x.campaign_id)},
      linkedContactId:null,linkedLeadIds:[],history:[],legacyCode:code,sourceRow:r.sourceRow
    });
  }

  return {
    ...base,version:2,revision:0,commands:[],audit:[],bookingApprovals:[],
    contacts,entries,leads,actions,deals,sessions,payments,
    vouchers:[],honoraria:[],bonuses:[],retentions:[],
    professionals:professionals.length?professionals:base.professionals,
    settings:{...(base.settings||{}),defaultLeadResponsibleId:pAna},
    syncMeta:{runId:sync.current_run_id,lastSuccessAt:sync.last_success_at,rowCount:Object.values(meta).reduce((n,m)=>n+Number(m.row_count||0),0),sheetCount:Object.keys(meta).length}
  };
}
