'use strict';
// Offline regression checks. No API calls or real writes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, '_next/static/chunks/pages/_app-f6904a460351655b.js'), 'utf8');
const match = [...source.matchAll(/JSON\.parse\(("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\)/g)].find(x => x[1].includes('vfParallelStarted'));
const app = JSON.parse(vm.runInNewContext(match[1]));
let expressions = 0;
function check(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.script === 'string') {
    new vm.Script('(' + value.script + ')');
    expressions++;
    assert(!/\.\.\.(pageVars|params|appVars)/.test(value.script), 'Capture runtime fields explicitly');
    for (const m of value.script.matchAll(/LOOKUP\((pageVars|appVars|params|outputs|data),"([^"]+)"\)/g)) {
      assert((value.dependencies || []).some(d => d[0] === m[1] && d[1] === m[2]), `Missing dependency ${m[1]}.${m[2]}`);
    }
  }
  Object.values(value).forEach(check);
}
check(app);
for (const flow of Object.values(app.logic.flows)) {
  for (const node of Object.values(flow.nodes)) {
    for (const targets of Object.values(node.connections || {})) {
      for (const target of Array.isArray(targets) ? targets : []) {
        if (target.type === 'node') assert(flow.nodes[target.id], 'Broken flow connection');
      }
    }
  }
}
for (const file of fs.readdirSync(root).filter(x => x.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const url = m[1].split('?')[0];
    if (/^(https?:|data:|mailto:|tel:|\/)/.test(url)) continue;
    assert(fs.existsSync(path.resolve(root, decodeURIComponent(url))), `Missing asset in ${file}`);
  }
}
const sandbox = { self: { webpackChunk_N_E: [] }, console, Date, Intl, setTimeout, clearTimeout };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const modules = Object.assign({}, ...sandbox.self.webpackChunk_N_E.map(x => x[1]));
const cache = {};
function requireModule(id) {
  if (cache[id]) return cache[id].exports;
  const module = { exports: {} };
  cache[id] = module;
  modules[id](module, module.exports, requireModule);
  return module.exports;
}
requireModule.nmd = x => x;
requireModule.d = (e, d) => Object.entries(d).forEach(([k, v]) => Object.defineProperty(e, k, { get: v }));
requireModule.r = e => Object.defineProperty(e, '__esModule', { value: true });
requireModule.n = e => () => e;
const functions = {
  LOOKUP: (v, k) => v?.[k], IS_EMPTY: v => v == null || v === '' || Array.isArray(v) && !v.length,
  IS_NUMBER: v => typeof v === 'number', DATETIME: v => requireModule(38600)([v]),
  IS_DATETIME: v => requireModule(78967)([v]), FORMAT_DATETIME_LOCAL: (v, f) => requireModule(71810)([v, f]),
  ROUND: (v, n) => Math.round(v * 10 ** n) / 10 ** n, NUMBER: Number, STRING: String,
  IF: (c, t, e) => c ? t : e, IS_EQUAL: (a, b) => a === b, NOW: () => '2026-10-08T12:00:00Z'
};
// The actual runtime exposes only declared dependencies, with non-enumerable fields.
function evaluate(expression, values) {
  const context = { ...functions, ...values };
  for (const name of ['pageVars', 'params', 'appVars']) {
    if (!context[name]) continue;
    const allowed = new Set((expression.dependencies || []).filter(d => d[0] === name).map(d => d[1]));
    context[name] = new Proxy(context[name], { ownKeys: () => [], get: (v, k) => allowed.has(k) ? v[k] : undefined });
  }
  return vm.runInNewContext('(' + expression.script + ')', context);
}
function valueExpression(node) { return node.inputs.variable.key.value.key; }

Object.assign(functions,{NOW:()=>"2026-10-13T12:00:00Z",SORT_BY_KEY:a=>a||[],FIND:(a,f)=>(a||[]).find(f),SELECT:(a,f)=>(a||[]).filter(f),COUNT:a=>(a||[]).length,UPPERCASE:v=>String(v??'').toUpperCase(),REPLACE_ALL:(v,a,b)=>String(v??'').split(a).join(b),SUM:a=>(a||[]).reduce((t,v)=>t+Number(v),0),DEFAULT:(v,d)=>v==null?d:v,IS_IN_ARRAY:(v,a)=>(a||[]).includes(v)});
function fixture(fid,page,patch={},missingCounters=false){
 const flow=app.logic.flows[fid], pageVars={...app.screens[page].pageVariables,valor:65,datapagamento:'2026-10-13',datafatura:'',numerofatura:'',conta:'Teste',fatura:'sim',itp:false,fisioterapeuta:'Ana Pereira',datasessao:'2026-10-13',horasessao:'13:45',fechada:'true',...patch};
 const params={negocio:'Avaliação',fisioterapeuta:'Ana Pereira',numerosessao:'900001',fechada:'',data:'2026-10-13',hora:'13:45',codigonegocio:'900002'};
 const appVars={numerocliente:page==='page.Page15'?'900999':'900003',numeronegocio:'900002',nome:'Cliente fictício',sessoeslocal:[],negocioslocal:[{codigonegocios:'900002',codigocontacto:'900003',valor:65}],leadslocal:[],pagamentoslocal:[]};
 const data={contadores1:missingCounters?[]:[{lista:'pagamentos',id:'4',sheets:'900010',appgyver:'900010'},{lista:'despesas',id:'5',sheets:'900020',appgyver:'900020'},{lista:'honorarios',id:'9',sheets:'900030',appgyver:'900030'}],listafisioterapeutas1:[{fisioterapeuta:pageVars.fisioterapeuta,email:'teste@example.invalid',zona:'1'}],tabelas1:[]};const outputs={},writes=[],trace=[],fail=new Set();let nav=0;const values={pageVars,params,appVars,data,outputs};
 function val(input){if(!input)return undefined;if(input.source==='expression')return evaluate(input.key,values);if(input.source==='object')return Object.fromEntries(Object.entries(input.key).map(([k,v])=>[k,val(v)]));if(input.source==='node'){const [field,id]=input.key.split('@@@');return outputs[id]?.[field];}return input.key;}
 async function run(id=flow.startConnection.id){const n=flow.nodes[id];if(!n)throw Error('Missing node '+id);trace.push(id);let port;
 if(n.title==='Set page variable'||n.title==='Set app variable'){let v=n.inputs.variable.key;(v.reference.source==='app-variable-ref'?appVars:pageVars)[v.reference.key]=val(v.value);port=Object.keys(n.connections)[0];}
 else if(n.title==='Set data variable'){const v=n.inputs.assignment.key;data[v.reference.key]=val(v.data);port=Object.keys(n.connections)[0];}
 else if(n.title==='If condition')port=val(n.inputs.condition)?'ceeba261-e546-4b5f-af45-47b75226fb2c':'871f4881-b57c-41d5-9934-a69367733066';
 else if(n.title==='HTTP request'){const body=val(n.inputs.body);writes.push({id,body});port=fail.has(id)?'a4ec0b24-5bf1-40d3-97f0-91689c16c0be':'180fc790-08a9-44c1-b7ab-265caf4f13e7';outputs[id]={resBody:{success:true},statusCode:fail.has(id)?500:200};}
 else if(n.title==='Get record collection'){const resource=n.inputs.request.key.resourceName.key;outputs[id]={records:resource==='listafisioterapeutas'?data.listafisioterapeutas1:resource==='contadores'?[{lista:'pagamentos',id:'4',sheets:'900010',appgyver:'900010'},{lista:'despesas',id:'5',sheets:'900020',appgyver:''},{lista:'honorarios',id:'9',sheets:'900030',appgyver:'900030'}]:resource==='negocios'?appVars.negocioslocal:[]};port=fail.has(id)?'08036d98-5276-477e-885d-bf5a093053e3':'81ba0b09-224c-4016-8f13-839c8a3ef20a';}
 else if(['Open page','Replace page','Navigate back'].includes(n.title)){nav++;return;}
 else if(n.title==='Alert'||n.title==='Toast')port=Object.keys(n.connections)[0];
 else if(n.title==='Confirm')port='d439758f-3d3e-4b03-adcf-bb093c3ff1fc';
 else throw Error('Unsupported '+id+' '+n.title);
 await Promise.all((n.connections[port]||[]).filter(t=>t.type==='node').map(t=>run(t.id)));
 }
 return{run,writes,trace,pageVars,fail,get nav(){return nav}};
}
(async()=>{for(const[fid,page]of [['19b4fdc.fbb16e0','page.Page16'],['bdb7392.ce690c8','page.Page15']]){const r=fixture(fid,page);await r.run();assert.equal(r.nav,1);console.log('PASS complete flow:',page,'requests:',r.writes.length);for(const {id}of r.writes){const test=fixture(fid,page);test.fail.add(id);await test.run();assert.equal(test.nav,0);assert.equal(test.pageVars[page==='page.Page16'?'vfNewPaySaving':'vfSessionSaving'],false);const prior=test.writes.slice(0,-1).map(w=>w.id);test.fail.clear();await test.run();assert.equal(test.nav,1);for(const completed of prior)assert.equal(test.writes.filter(w=>w.id===completed).length,1,'Repeated confirmed write '+completed);}}
const early=fixture('19b4fdc.fbb16e0','page.Page16',{},true);await early.run();assert.equal(early.nav,1);for(const w of early.writes){const records=Array.isArray(w.body)?w.body:[w.body];for(const record of records)for(const key of ['codigopagamentos','codigonegocios','codigocontacto','id_despesa'])if(key in record)assert(Number.isFinite(record[key]),w.id+' invalid '+key);};console.log('PASS cold counter load: fresh prerequisites prevent invalid identifiers.'); const honorary=fixture('bdb7392.ce690c8','page.Page15',{fisioterapeuta:'Rita Teste'});await honorary.run();assert.equal(honorary.nav,1);assert(honorary.writes.some(w=>w.id==='5ad43d48.7cf9b4'));const body=honorary.writes.find(w=>w.id==='5ad43d48.7cf9b4').body[0];assert.equal(body.codigocontacto,900003);assert.equal(body.valor,65);const unavailable=fixture('19b4fdc.fbb16e0','page.Page16');unavailable.fail.add('vf-newpay-counters');await unavailable.run();assert.equal(unavailable.writes.length,0);assert.equal(unavailable.nav,0);for(const itp of [true,false]){const variant=fixture('19b4fdc.fbb16e0','page.Page16',{itp});await variant.run();assert.equal(variant.nav,1);}for(const readId of ['vf-session-counters','vf-session-business-read','vf-session-fisio-read']){const test=fixture('bdb7392.ce690c8','page.Page15');test.fail.add(readId);await test.run();assert.equal(test.writes.length,0);assert.equal(test.nav,0);assert.equal(test.pageVars.vfSessionSaving,false);}console.log('PASS honorarium customer from business, payment variants, prerequisite failures without writes, recovery without duplicate confirmed writes.');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
