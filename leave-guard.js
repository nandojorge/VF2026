/* Unsaved-form protection. Form values stay in memory only. */
(function () {
  'use strict';
  var schema = window.vfFormSchema || {}, contexts = {}, active, singleton, installed, navigationBusy = false;
  var indexKey = '__vfLeaveIndex', index = Number(history.state && history.state[indexKey]) || 0;
  var push = history.pushState.bind(history), replace = history.replaceState.bind(history), go = history.go.bind(history);
  var restoringPop = false, allowedPop = false, pendingPop = false;
  // Remove only this app's obsolete drafts; never read or transmit their contents.
  try { for (var i = localStorage.length - 1; i >= 0; i--) { var key = localStorage.key(i); if (key && key.indexOf('vf2026:draft:v1:') === 0) localStorage.removeItem(key); } } catch (_) {}
  function stamp(state, value) { return Object.assign({}, state || {}, (function () { var v={};v[indexKey]=value;return v; })()); }
  replace(stamp(history.state,index),'',location.href);
  history.pushState = function (state,title,url) { index++; return push(stamp(state,index),title,url); };
  history.replaceState = function (state,title,url) { return replace(stamp(state,index),title,url); };
  function current(context) {
    var match = location.pathname.match(/(?:m-)?page\.Page(\d+)/);
    return !!context && !!schema[context.pageId] && (!match || context.pageId === 'page.Page' + match[1]);
  }
  function snapshot(s) { var result={};schema[s.context.pageId].fields.forEach(function (key) { var v=s.adapter.get(key);result[key]=v===undefined?null:v; });return JSON.stringify(result); }
  function changedState(s) { return !!s && !s.suppressed && (s.writing || (s.touched && snapshot(s)!==s.baseline)); }
  function dirty() { return changedState(active); }
  function ask() {
    if (!dirty()) return Promise.resolve(true);
    return window.vfFeedback.confirm({title:'Queres sair sem guardar?',message:active.writing?'Há uma gravação iniciada. Se saíres, verifica o registo antes de repetir a operação. As alterações por guardar serão perdidas.':'As alterações serão perdidas.',buttonTitles:{cancel:'Continuar a editar',ok:'Sair sem guardar'}}).then(function (r) { return r.clickedIndex===1; });
  }
  function navigate(action) {
    var s=active;
    if(!dirty())return action();
    if(navigationBusy||pendingPop)return Promise.resolve(false);navigationBusy=true;
    return ask().then(function(ok){if(!ok)return false;s.suppressed=true;return action();}).then(function(result){
      if(result===false&&s)s.suppressed=false;
      // SDK history actions resolve before traversal is delivered.
      setTimeout(function(){if(s&&current(s.context))s.suppressed=false;},500);
      navigationBusy=false;return result;
    },function(error){if(s)s.suppressed=false;navigationBusy=false;throw error;});
  }
  function install() {
    var router=singleton && singleton.router;if(!router || installed===router)return;installed=router;
    if(router.events&&router.events.on)router.events.on('routeChangeComplete',function(){if(active&&!current(active.context))active=null;});
    ['push','replace'].forEach(function(method){var original=router[method].bind(router);router[method]=function(){var args=arguments;return navigate(function(){return original.apply(null,args);});};});
  }
  function observe(context,adapter) {
    install();if(!current(context))return;
    var s=contexts[context.pageContextId];
    if(s && active!==s){s.touched=false;s.writing=false;s.writes={};s.suppressed=false;s.adapter=adapter;s.baseline=snapshot(s);}
    if(!s){s=contexts[context.pageContextId]={context:context,adapter:adapter,touched:false,writing:false,writes:{},baseline:null};s.baseline=snapshot(s);}
    active=s;
  }
  function changed(context,field,value) {
    var s=context&&contexts[context.pageContextId];if(!s||!current(context))return;
    if(field==='vfLeaveSignal') {
      var parts=String(value).split('|');
      if(parts[0]==='complete'||(context.pageId==='page.Page25'&&parts[0]==='confirmed')){
        if(parts[0]==='confirmed')s.writes[parts[1]]='confirmed';
        var states=Object.values(s.writes);if(states.length&&states.every(function(v){return v==='confirmed';})){s.baseline=snapshot(s);s.touched=false;s.writing=false;s.suppressed=false;}
      } else {s.writes[parts[1]]=parts[0];s.writing=true;}
    } else if(!s.touched&&!s.writing) s.baseline=snapshot(s);
  }
  // Two-way React bindings also change values directly in the store. Capture the
  // baseline before their handlers run; compare actual form values when leaving.
  ['input','change','pointerdown','keydown'].forEach(function(type){document.addEventListener(type,function(event){
    if(!active||!current(active.context)||event.target.closest('.vf-feedback-overlay'))return;
    if(!active.touched){active.baseline=snapshot(active);active.touched=true;}
  },true);});
  window.addEventListener('beforeunload',function(event){if(dirty()){event.preventDefault();event.returnValue='';}});
  // Intercept traversal before Next and the app's cache-cleanup listeners. A
  // rejected traversal is first undone, then the original traversal is replayed
  // only after explicit confirmation. No sentinel history entry is added.
  window.addEventListener('popstate',function(event){
    var target=Number(event.state&&event.state[indexKey]);
    if(restoringPop){event.stopImmediatePropagation();if(Number.isFinite(target)&&target!==index){go(index-target);return;}restoringPop=false;return;}
    if(allowedPop){allowedPop=false;index=Number.isFinite(target)?target:index;return;}
    if(!dirty()){index=Number.isFinite(target)?target:index;return;}
    event.stopImmediatePropagation();
    if(pendingPop)return;
    var delta=Number.isFinite(target)?index-target:1;
    if(!delta)delta=1;
    if(navigationBusy){restoringPop=true;go(delta);return;}
    pendingPop=true;restoringPop=true;go(delta);
    // Let the restoration event finish before showing the blocking dialog.
    setTimeout(function wait(){if(restoringPop){setTimeout(wait,10);return;}
      ask().then(function(ok){pendingPop=false;if(ok){if(active)active.suppressed=true;active=null;allowedPop=true;go(-delta);}});
    },10);
  },true);
  window.vfLeave={observe:observe,changed:changed,navigate:navigate,router:function(r){singleton=r;install();}};
}());
