/* Optional loading feedback. Original application and requests remain unchanged. */
(() => {
  'use strict';
  let panel, message, stage, retry, started = 0, pending = 0, completed = 0, failures = 0;
  const active = () => {
    const root = document.getElementById('__next');
    return root && /vivusfisioapp/i.test(root.textContent) && /4\.0\.42/.test(root.textContent);
  };
  const update = () => {
    if (!active()) {
      if (panel) panel.remove();
      panel = null;
      started = 0;
      return;
    }
    if (!panel) {
      started = Date.now();
      panel = document.createElement('section');
      panel.id = 'vf-loading-status';
      panel.setAttribute('aria-label', 'Estado do carregamento');
      message = document.createElement('p');
      message.setAttribute('role', 'status');
      message.setAttribute('aria-live', 'polite');
      stage = document.createElement('p');
      stage.className = 'vf-loading-hint';
      retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Tentar novamente';
      retry.addEventListener('click', () => {
        if (active()) location.reload();
      });
      const hint = document.createElement('p');
      hint.className = 'vf-loading-hint';
      hint.textContent = 'Tentar novamente reinicia o carregamento desta página.';
      panel.append(message, stage, retry, hint);
      document.body.append(panel);
    }
    const sourceText = Array.from(document.querySelectorAll('#__next [style]')).find(el =>
      !el.children.length && el.textContent.trim() && el.style.fontFamily);
    if (sourceText) {
      const font = window.getComputedStyle(sourceText);
      panel.style.fontFamily = font.fontFamily;
      panel.style.fontWeight = font.fontWeight;
      panel.style.fontStyle = font.fontStyle;
      panel.style.color = font.color;
    }
    const slow = Date.now() - started >= 20000;
    const text = failures
      ? 'Alguns pedidos de dados falharam. A app continua a tentar carregar. Podes reiniciar o carregamento.'
      : slow
        ? 'O carregamento está a demorar mais do que o habitual. Podes aguardar ou tentar novamente.'
        : pending
          ? `A receber dados dos serviços da app. Pedidos concluídos: ${completed}.`
          : completed
            ? `A preparar a app. Pedidos concluídos: ${completed}.`
            : 'A carregar os dados da app…';
    const originalStatus = document.getElementById('__next').innerText.replace(/vivusfisioapp/ig, '').replace(/4\.0\.42/g, '').trim();
    const stageText = originalStatus && !/^a carregar dados$/i.test(originalStatus) ? `Estado da app: ${originalStatus}` : '';
    if (stage.textContent !== stageText) stage.textContent = stageText;
    if (message.textContent !== text) message.textContent = text;
    retry.hidden = !(failures || slow);
    panel.lastChild.hidden = retry.hidden;
  };
  // Observe only GET requests; never retry, change, or inspect request payloads.
  const originalFetch = window.fetch;
  if (originalFetch) window.fetch = function (...args) {
    let track = false;
    try {
      const request = args[0];
      const url = new URL(typeof request === 'string' || request instanceof URL ? request : request.url, location.href);
      const method = args[1]?.method || request?.method || 'GET';
      track = active() && method.toUpperCase() === 'GET' &&
        ['api.steinhq.com', 'firestore.googleapis.com'].includes(url.hostname);
    } catch (_) { /* Feedback must never interrupt an application request. */ }
    if (track) pending++;
    const result = originalFetch.apply(this, args);
    if (track) result.then(response => {
      pending--; completed++;
      if (!response.ok) failures++;
    }, () => { pending--; failures++; });
    return result;
  };
  window.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '#vf-loading-status{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);width:min(420px,calc(100% - 32px));box-sizing:border-box;padding:16px 20px;border:0!important;border-radius:0!important;background:transparent!important;color:rgb(50,51,57);box-shadow:none!important;font:200 16px/24px "Archivo Narrow_200",system-ui,sans-serif;text-align:center;z-index:1000}#vf-loading-status p{margin:0}#vf-loading-status button{margin-top:12px;padding:10px 18px;border:0;border-radius:7px;background:#333;color:#fff;font:inherit;cursor:pointer}#vf-loading-status button:focus-visible{outline:3px solid #4686dd;outline-offset:3px}#vf-loading-status .vf-loading-hint{margin-top:8px;font-size:14px;color:rgb(50,51,57)}#vf-loading-status [hidden]{display:none}';
    document.head.append(style);
    setInterval(update, 1000);
    update();
  }, { once: true });
})();
