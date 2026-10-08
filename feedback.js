/* Shared mobile feedback. Keeps the original blocking Alert/Confirm contracts. */
(function () {
  'use strict';
  if (window.vfFeedback) return;
  var queue = Promise.resolve(), toastTimer;
  function plain(value) {
    if (value == null || value === 'undefined' || value === 'null') return '';
    if (typeof value === 'string') return value;
    return '';
  }
  function technical(value) {
    if (value && typeof value === 'object') return !!(value.error || value.code || value.message || value.stack);
    return typeof value === 'string' && (/^\s*[{[]/.test(value) || /INVALID_ARGUMENT|timestampValue|document\.fields|TypeError|resBody@@@|NetworkError|Failed to fetch/i.test(value));
  }
  function normalize(options) {
    var raw = technical(options.title) || technical(options.message);
    return {
      title: raw ? 'Não foi possível concluir o pedido' : plain(options.title) || 'Informação',
      message: raw ? 'O serviço não confirmou este pedido. Verifica o estado do registo antes de repetir a operação.' : plain(options.message)
    };
  }
  function dialog(options, confirm) {
    var run = function () { return new Promise(function (resolve) {
      var text = normalize(options), previousFocus = document.activeElement;
      var previousOverflow = document.body.style.overflow;
      var overlay = document.createElement('div'); overlay.className = 'vf-feedback-overlay';
      var card = document.createElement('section'); card.className = 'vf-feedback-dialog';
      card.setAttribute('role', 'alertdialog'); card.setAttribute('aria-modal', 'true');
      card.setAttribute('aria-labelledby', 'vf-feedback-title');
      var heading = document.createElement('h2'); heading.id = 'vf-feedback-title'; heading.textContent = text.title;
      var content = document.createElement('div'); content.className = 'vf-feedback-content'; content.appendChild(heading);
      if (text.message) { var message = document.createElement('p'); message.id = 'vf-feedback-message'; message.textContent = text.message; content.appendChild(message); card.setAttribute('aria-describedby', message.id); }
      var actions = document.createElement('div'); actions.className = 'vf-feedback-actions';
      var closed = false;
      function finish(index) {
        if (closed) return; closed = true; overlay.remove(); document.body.style.overflow = previousOverflow;
        document.removeEventListener('keydown', keydown, true);
        if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
        resolve({ clickedIndex: index });
      }
      function button(label, index, secondary) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        if (secondary) b.className = 'vf-feedback-secondary';
        b.addEventListener('click', function () { finish(index); }); actions.appendChild(b); return b;
      }
      var cancel;
      if (confirm) cancel = button(plain(options.buttonTitles && options.buttonTitles.cancel) || 'Cancelar', 0, true);
      var ok = button(plain(confirm ? options.buttonTitles && options.buttonTitles.ok : options.buttonTitle) || (confirm ? 'Confirmar' : 'OK'), 1, false);
      function keydown(event) {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(confirm ? 0 : 1); }
        if (event.key === 'Tab') {
          var first = cancel || ok, last = ok;
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          else if (!card.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
        }
      }
      card.append(content, actions); overlay.appendChild(card); document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden'; document.addEventListener('keydown', keydown, true);
      // Cancel receives initial focus for confirmations that may repeat an uncertain write.
      (cancel || ok).focus();
    }); };
    var result = queue.then(run, run); queue = result.catch(function () {}); return result;
  }
  function toast(options) {
    var existing = document.getElementById('vf-feedback-toast'); if (existing) existing.remove();
    clearTimeout(toastTimer);
    var box = document.createElement('div'); box.id = 'vf-feedback-toast'; box.className = 'vf-feedback-toast';
    box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    box.textContent = technical(options.message) ? 'O serviço não confirmou o pedido. Verifica o estado do registo.' : plain(options.message);
    if (!box.textContent) return Promise.resolve();
    document.body.appendChild(box);
    var remove = function () { box.remove(); };
    if (options.hideOnPress !== false) box.addEventListener('click', remove);
    toastTimer = setTimeout(remove, Math.max(3500, Math.min(Number(options.duration) || 3500, 10000)));
    return Promise.resolve();
  }
  window.vfFeedback = { alert: function (o) { return dialog(o, false); }, confirm: function (o) { return dialog(o, true); }, toast: toast, normalize: normalize };
}());
