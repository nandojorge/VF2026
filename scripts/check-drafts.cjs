'use strict';
// Draft persistence and interrupted-write regression checks. No API calls.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'drafts.js'),'utf8');
class Element { constructor(tag){this.tagName=tag;this.children=[];this.events={};this.parentNode=null;} appendChild(e){this.children.push(e);e.parentNode=this;return e;} prepend(e){this.children.unshift(e);e.parentNode=this;} insertBefore(e){this.prepend(e);} remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(e=>e!==this);} setAttribute(){} addEventListener(k,f){this.events[k]=f;} contains(e){return e===this||this.children.some(c=>c.contains(e));} }
const pause=()=>new Promise(r=>setTimeout(r,20));
function create(store, record='1', options={}) {
 const body=new Element('body'),next=new Element('div');body.appendChild(next);const events={},wevents={};let now=Date.now();
 const document={body,hidden:false,createElement:t=>new Element(t),getElementById:id=>id==='__next'?next:null,addEventListener:(k,f)=>events[k]=f};
 const window={vfDraftSchema:{'page.Page17':{fields:['valor','fatura','datapagamento'],params:['codigopagamentos']}},addEventListener:(k,f)=>wevents[k]=f,vfFeedback:{confirm:async()=>({clickedIndex:options.confirm===false?0:1})}};
 const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(options.quota)throw Error('quota');store.set(k,v);},removeItem:k=>store.delete(k)};
 const context={pageId:'page.Page17',pageContextId:'test-'+record},values={valor:10,fatura:'nao',datapagamento:'2026-10-08'};
 const adapter={get:k=>values[k],set:(k,v)=>{values[k]=v;window.vfDrafts.changed(context,k,v);},param:k=>k==='codigopagamentos'?record:undefined,app:()=>undefined};
 vm.runInNewContext(code,{window,document,location:{pathname:'/page.Page17.html'},localStorage:storage,Date:class extends Date{static now(){return now+=400;}},setTimeout:(f)=>setTimeout(f,0),clearTimeout,setInterval:()=>0,console});window.vfDrafts.observe(context,adapter);
 return {window,context,values,events,body,change(v){values.valor=v;events.input({type:'input',target:next,isTrusted:true});},signal(v){window.vfDrafts.changed(context,'vfDraftSignal',v);},buttons(){return body.children.filter(e=>e.className==='vf-draft-bar').flatMap(e=>e.children).filter(e=>e.tagName==='button');}};
}
(async()=>{
 const store=new Map(),a=create(store);await pause();assert.equal(store.size,0,'No draft from initialization');a.values.fatura='sim';a.values.datapagamento='2026-11-04';a.change(123);await pause();assert.equal(store.size,1);let saved=JSON.parse([...store.values()][0]);assert.equal(saved.values.valor,123);assert.equal(saved.review,false);
 const b=create(store,'2');await pause();assert.equal(b.buttons().length,0,'Separate record');
 const c=create(store);await pause();assert(c.buttons().some(x=>x.textContent==='Recuperar'));c.buttons().find(x=>x.textContent==='Recuperar').events.click();await pause();assert.equal(c.values.valor,123);assert.equal(c.values.fatura,'sim');assert.equal(c.values.datapagamento,'2026-11-04');
 c.signal('pending|write');c.signal('failed|write');c.signal('complete');assert.equal(store.size,1,'Failure must preserve draft');assert(JSON.parse([...store.values()][0]).review);
 const blocked=create(store,'1',{confirm:false});await pause();blocked.buttons().find(x=>x.textContent==='Recuperar').events.click();await pause();assert.equal(blocked.values.valor,10,'Interrupted write needs review');
 c.signal('pending|write');c.signal('confirmed|write');c.signal('complete');assert.equal(store.size,0,'Confirmed completion clears draft');
 const q=create(new Map(),'3',{quota:true});await pause();q.change(40);await pause();assert(q.body.children.some(e=>e.className==='vf-draft-bar'&&e.children.some(x=>x.textContent?.includes('Não foi possível'))),'Storage failure is visible');
 const same=new Map(),older=create(same,'4');await pause();older.change(80);await pause();const newer=JSON.parse([...same.values()][0]);newer.revision='other-tab';same.set([...same.keys()][0],JSON.stringify(newer));older.signal('confirmed|write');older.signal('complete');assert.equal(same.size,1,'Older tab cannot clear newer draft');
 const d=create(new Map(),'5');await pause();d.change(22);await pause();d.buttons().find(x=>x.textContent==='Eliminar rascunho').events.click();assert.equal(d.buttons().length,0,'Explicit discard');assert.equal(d.values.valor,22,'Discard does not clear live fields');
 console.log('PASS: no initial draft; persistence; record isolation; recovery; interruption review/cancel; failure retention; success cleanup; storage failure; newer-tab protection; explicit discard. No API requests.');
})().catch(e=>{console.error(e);process.exitCode=1;});
