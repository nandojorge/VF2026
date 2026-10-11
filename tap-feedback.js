/* Immediate tactile feedback only: never triggers or confirms an app action. */
(function () {
  'use strict';
  if (window.vfTapFeedback) return;
  window.vfTapFeedback = true;
  var selector = 'button,[role="button"],a[href]', active, origin, timer;
  function control(target) {
    var el = target && target.closest ? target.closest(selector) : null;
    return el && !el.disabled && el.getAttribute('aria-disabled') !== 'true' ? el : null;
  }
  function clear() {
    clearTimeout(timer);
    if (active) active.classList.remove('vf-tap-active');
    active = null; origin = null;
  }
  function show(el) { clear(); active = el; el.classList.add('vf-tap-active'); }
  document.addEventListener('pointerdown', function (e) {
    if (!e.isPrimary || e.button !== 0) return;
    var el = control(e.target); if (!el) return;
    show(el); origin = { x: e.clientX, y: e.clientY };
  }, true);
  document.addEventListener('pointermove', function (e) {
    if (origin && (Math.abs(e.clientX-origin.x)>10 || Math.abs(e.clientY-origin.y)>10)) clear();
  }, { capture: true, passive: true });
  document.addEventListener('pointerup', function () { origin = null; timer = setTimeout(clear, 220); }, true);
  document.addEventListener('pointercancel', clear, true);
  document.addEventListener('scroll', clear, { capture: true, passive: true });
  document.addEventListener('click', function (e) {
    var el = control(e.target); if (!el) return;
    show(el); timer = setTimeout(clear, 220);
  }, true);
  window.addEventListener('blur', clear);
}());
