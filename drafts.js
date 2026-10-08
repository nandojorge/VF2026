/* Local form drafts. No network requests and no automatic submissions. */
(function () {
  'use strict';
  var schema = window.vfDraftSchema || {}, contexts = {}, activeState, lastInput = 0;
  var prefix = 'vf2026:draft:v1:', bar, notice, restoring = false;
  function clone(v) { return v === undefined ? null : JSON.parse(JSON.stringify(v)); }
  function current(context) {
    var match = location.pathname.match(/(?:m-)?page\.Page(\d+)/);
    return !!context && !!schema[context.pageId] && (!match || context.pageId === 'page.Page' + match[1]);
  }
  function load(key) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v && v.version === 1 && v.values && typeof v.values === 'object' ? v : null; } catch (_) { return null; }
  }
  function snapshot(s) { var values = {}; schema[s.context.pageId].fields.forEach(function (field) { values[field] = clone(s.adapter.get(field)); }); return values; }
  function identity(s) {
    var ids = {}, page = Number(s.context.pageId.split('Page')[1]);
    var keys = {3:[],5:['a:numerocliente'],6:['p:codigoacao'],7:['a:numerocliente'],8:['a:numerocliente'],9:['a:numerolead'],10:['a:numerocliente'],12:['a:numerolead','a:numerocliente'],13:['a:numeronegocio'],14:['p:codigonegocio'],15:['p:numerosessao'],16:['a:numerosessao'],17:['p:codigopagamentos'],25:['a:numerocliente','a:numerolead'],26:['p:codigoclientelead'],29:['p:codigoentrada']};
    (keys[page] || []).forEach(function (key) { var parts = key.split(':'), v = parts[0] === 'p' ? s.adapter.param(parts[1]) : s.adapter.app(parts[1]); if (v !== undefined && v !== null && v !== '') ids[key] = String(v); });
    // Pages without a usable original ID are isolated by their complete parameter set.
    if (page !== 3 && !Object.keys(ids).length) schema[s.context.pageId].params.forEach(function (key) { var v = s.adapter.param(key); if (v !== undefined && v !== null) ids[key] = v; });
    return prefix + s.context.pageId + ':' + JSON.stringify(ids);
  }
  function removeOwned(s) {
    var saved = load(s.key); if (saved && saved.revision !== s.revision) return false;
    try { localStorage.removeItem(s.key); return true; } catch (_) { return false; }
  }
  function save(s) {
    if (!current(s.context) || !s.ready || s.cleared || s.conflict || !s.dirty) return;
    try {
      var saved = load(s.key);
      if (saved && saved.revision !== s.revision && s.revision) { s.conflict = true; render(s); return; }
      s.revision = s.revision || Date.now() + '-' + Math.random().toString(36).slice(2);
      var draft = { version: 1, revision: s.revision, page: s.context.pageId, values: snapshot(s), review: s.review, updated: Date.now() };
      localStorage.setItem(s.key, JSON.stringify(draft)); s.saved = draft; s.error = false;
    } catch (_) { s.error = true; }
    render(s);
  }
  function element(tag, text) { var e = document.createElement(tag); if (text) e.textContent = text; return e; }
  function render(s) {
    if (activeState !== s || !current(s.context)) return;
    if (bar) bar.remove(); bar = null;
    if (s.cleared || (!s.saved && !s.error && !s.conflict)) return;
    bar = element('aside'); bar.className = 'vf-draft-bar'; bar.setAttribute('aria-label', 'Rascunho do formulário');
    notice = element('p', s.error ? 'Não foi possível guardar o rascunho neste dispositivo. Mantém este formulário aberto.' : s.conflict ? 'Outro separador atualizou este rascunho. Recupera a versão guardada antes de continuar.' : s.available ? 'Tens um rascunho deste formulário guardado neste dispositivo.' : s.review ? 'Rascunho guardado. A gravação iniciada precisa de verificação antes de repetir.' : 'Rascunho guardado neste dispositivo.');
    notice.setAttribute('role', 'status'); bar.appendChild(notice);
    if (s.available || s.conflict) {
      var recover = element('button', 'Recuperar'); recover.type = 'button'; recover.addEventListener('click', function () { recoverDraft(s); }); bar.appendChild(recover);
    }
    if (!s.error) {
      var discard = element('button', 'Eliminar rascunho'); discard.type = 'button'; discard.className = 'vf-draft-discard';
      discard.addEventListener('click', function () {
        try { localStorage.removeItem(s.key); } catch (_) { s.error = true; render(s); return; }
        s.saved = null; s.available = false; s.conflict = false; s.revision = null; s.dirty = false; s.review = false; s.cleared = false; render(s);
      }); bar.appendChild(discard);
    }
    var root = document.getElementById('__next'); if (root && root.parentNode) root.parentNode.insertBefore(bar, root); else document.body.prepend(bar);
  }
  async function recoverDraft(s) {
    var draft = load(s.key); if (!draft || activeState !== s) return;
    if (draft.review) {
      var result = await window.vfFeedback.confirm({title:'Verificar a gravação anterior',message:'Uma gravação foi iniciada e pode ter sido recebida. Verifica primeiro o registo nas listas para evitar duplicados. Recuperar repõe apenas os campos; não repete pedidos nem retoma etapas de gravação.',buttonTitles:{cancel:'Voltar',ok:'Já verifiquei · Recuperar'}});
      if (result.clickedIndex !== 1 || activeState !== s) return;
    }
    restoring = true; s.available = false; s.conflict = false; s.saved = draft; s.revision = draft.revision; s.review = !!draft.review; s.cleared = false;
    try {
      for (var field of schema[s.context.pageId].fields) if (Object.prototype.hasOwnProperty.call(draft.values, field)) {
        if (activeState !== s || !current(s.context)) break;
        s.adapter.set(field, clone(draft.values[field]));
        // Give existing field-change flows time to update derived values before the next field.
        await new Promise(function (resolve) { setTimeout(resolve, 25); });
      }
    } finally { restoring = false; s.dirty = true; save(s); }
  }
  function observe(context, adapter) {
    if (!current(context)) return;
    var id = context.pageContextId, s = contexts[id];
    if (!s) {
      s = contexts[id] = { context:context, adapter:adapter, writes:{}, ready:false, dirty:false, review:false, lastChange:Date.now() };
      s.timer = setTimeout(function ready() {
        if (!current(s.context)) return;
        if (Date.now() - s.lastChange < 300) { s.timer = setTimeout(ready, 300); return; }
        s.key = identity(s); s.ready = true; s.baseline = JSON.stringify(snapshot(s)); s.saved = load(s.key); s.available = !!s.saved; s.revision = s.saved && s.saved.revision;
        activeState = s; if (s.earlyEdited && !s.available) { s.dirty = true; save(s); } else render(s);
      }, 1000);
      activeState = s;
    } else if (s.ready && activeState !== s) { activeState = s; render(s); }
  }
  function changed(context, field, value) {
    var s = context && contexts[context.pageContextId]; if (!s || !current(context)) return;
    if (field === 'vfDraftSignal') {
      if (!s.ready) { s.key = identity(s); s.ready = true; s.saved = load(s.key); s.revision = s.saved && s.saved.revision; clearTimeout(s.timer); }
      var parts = String(value).split('|');
      if (parts[0] === 'complete' || (context.pageId === 'page.Page25' && parts[0] === 'confirmed')) {
        if (parts[0] === 'confirmed') s.writes[parts[1]] = 'confirmed';
        var states = Object.values(s.writes);
        if (states.length && states.every(function (v) { return v === 'confirmed'; }) && removeOwned(s)) { s.saved = null; s.cleared = true; s.dirty = false; render(s); }
      } else {
        s.writes[parts[1]] = parts[0]; s.review = true; s.dirty = true; s.cleared = false; save(s);
      }
      return;
    }
    if (!schema[context.pageId].fields.includes(field.split('.')[0])) return;
    s.lastChange = Date.now();
    if (!s.ready || restoring || Date.now() - lastInput > 2000) return;
    // Never overwrite an offered draft with initial/default form values.
    if (s.available) return;
    s.dirty = true; s.cleared = false; save(s);
  }
  ['input','change','pointerdown','keydown'].forEach(function (type) { document.addEventListener(type, function (event) {
    if (bar && bar.contains(event.target)) return;
    lastInput = Date.now();
    // React's two-way bindings can update the store without calling setPageVariable.
    // Read the authoritative values after the input event and its existing change flows.
    var s = activeState;
    if (s && !s.ready && (event.type === "input" || event.type === "change")) {
      clearTimeout(s.timer); s.key = identity(s); s.ready = true; s.baseline = JSON.stringify(snapshot(s)); s.saved = load(s.key); s.available = !!s.saved; s.revision = s.saved && s.saved.revision;
    }
    if (s && s.ready && !s.available && !restoring && (event.type === "input" || event.type === "change")) s.dirty = true;
    if (s && s.ready && !s.available && !restoring) setTimeout(function () {
      if (activeState === s && current(s.context) && JSON.stringify(snapshot(s)) !== s.baseline) { s.dirty = true; s.cleared = false; save(s); }
    }, 40);
  }, true); });
  window.addEventListener('pagehide', function () { if (activeState) save(activeState); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && activeState) save(activeState); });
  window.addEventListener('storage', function (event) { var s = activeState; if (s && event.key === s.key) { var saved = load(s.key); if (!saved || saved.revision !== s.revision) { s.conflict = true; render(s); } } });
  // Remove the banner when the router leaves the form, without touching its draft.
  var lastPath = location.pathname;
  setInterval(function () { if (lastPath !== location.pathname) { lastPath = location.pathname; if (bar) bar.remove(); bar = null; activeState = null; } }, 250);
  window.vfDrafts = { observe:observe, changed:changed };
}());
