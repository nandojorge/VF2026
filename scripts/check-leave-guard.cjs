'use strict';
// In-memory guard checks. No browser storage writes, network requests or real forms.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'..','leave-guard.js'),'utf8');const tick=()=>new Promise(r=>setTimeout(r,15));
function make(){
 const listeners={},documentListeners={},values={nome:'',data:'2026-10-08'},choices=[],calls=[],removed=[];
 const location={pathname:'/page.Page3.html',href:'http://localhost/page.Page3.html'};
 const history={state:{__N:true},pushState(s,t,url){this.state=s;},replaceState(s){this.state=s;},go(delta){calls.push(['go',delta]);}};
 const storage=new Map([['vf2026:draft:v1:old','private draft'],['unrelated','keep']]);
 const window={vfFormSchema:{'page.Page3':{fields:['nome','data']}},addEventListener:(k,f)=>listeners[k]=f,vfFeedback:{confirm:async o=>{calls.push(['confirm',o.title]);return{clickedIndex:choices.shift()||0};}}};
 vm.runInNewContext(code,{window,document:{addEventListener:(k,f)=>documentListeners[k]=f},location,history,localStorage:{get length(){return storage.size;},key:i=>[...storage.keys()][i],removeItem:k=>{removed.push(k);storage.delete(k);}},setTimeout:(f)=>setTimeout(f,0)});
 const context={pageId:'page.Page3',pageContextId:'test'},adapter={get:k=>values[k]};window.vfLeave.observe(context,adapter);
 const router={push:async url=>{calls.push(['push',url]);location.pathname=url;return true;},replace:async url=>{calls.push(['replace',url]);location.pathname=url;return true;}};window.vfLeave.router({router});
 function input(value){documentListeners.input({target:{closest:()=>null}});values.nome=value;}
 function unload(){const e={preventDefault(){this.prevented=true;}};listeners.beforeunload(e);return !!e.prevented;}
 function pop(state){const e={state,stopImmediatePropagation(){this.stopped=true;}};history.state=state;listeners.popstate(e);return !!e.stopped;}
 return{window,values,calls,choices,removed,storage,context,router,history,input,unload,pop,signal:v=>window.vfLeave.changed(context,'vfLeaveSignal',v)};
}
(async()=>{
 let t=make();assert.deepEqual(t.removed,['vf2026:draft:v1:old']);assert.equal(t.storage.get('unrelated'),'keep');assert(!t.unload());
 t.values.data='2026-10-09';t.window.vfLeave.changed(t.context,'data',t.values.data);assert(!t.unload(),'Initialization is clean');
 t.input('Teste');assert(t.unload(),'Native unload prompt for changed fields');t.choices.push(0);assert.equal(await t.router.push('/page.Page1.html'),false);assert.equal(t.values.nome,'Teste');assert(!t.calls.some(c=>c[0]==='push'));
 t.choices.push(1);await t.router.push('/page.Page1.html');assert(t.calls.some(c=>c[0]==='push'));assert(!t.unload(),'No second prompt after explicit discard');
 t=make();t.input('x');t.input('');assert(!t.unload(),'Reverting edits is clean');await t.router.push('/page.Page1.html');assert(!t.calls.some(c=>c[0]==='confirm'));
 t=make();t.input('x');t.signal('pending|write');t.signal('failed|write');assert(t.unload(),'Failure retains protection');t.signal('pending|write');t.signal('confirmed|write');t.signal('complete');assert(!t.unload());await t.router.push('/page.Page1.html');assert(!t.calls.some(c=>c[0]==='confirm'),'Confirmed save exits without warning');
 t=make();t.history.pushState({},'', '/page.Page3.html');t.input('x');t.choices.push(0);assert(t.pop({__vfLeaveIndex:0}));assert.deepEqual(t.calls.at(-1),['go',1]);assert(t.pop({__vfLeaveIndex:1}));await tick();assert.equal(t.calls.filter(c=>c[0]==='go').length,1,'Cancelled back restores entry');assert(t.unload());
 t.choices.push(1);assert(t.pop({__vfLeaveIndex:0}));assert(t.pop({__vfLeaveIndex:1}));await tick();assert.deepEqual(t.calls.at(-1),['go',-1]);assert(!t.pop({__vfLeaveIndex:0}));assert(!t.unload(),'Accepted traversal disarms old form');t.window.vfLeave.observe(t.context,{get:k=>t.values[k]});t.input('new edit');assert(t.unload(),'Re-entered form is protected again');
 t=make();t.input('SDK');t.choices.push(0);let executed=false;await t.window.vfLeave.navigate(()=>{executed=true;});assert(!executed,'SDK navigation cancelled');t.choices.push(1);await t.window.vfLeave.navigate(()=>{executed=true;return true;});assert(executed);
 console.log('PASS: legacy draft cleanup; clean/reverted forms; native unload; cancel/leave; failed-save protection; confirmed-save exit; browser-back cancel/accept; SDK navigation. No API requests.');
})().catch(e=>{console.error(e);process.exitCode=1;});
