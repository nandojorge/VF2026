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
for (const [fid, page, start, snapshot, prefix] of [
  ['3dd3bda.213db3d', 'page.Page17', 'vf-pay-is-new', 'vf-pay-snapshot', 'vfPay'],
  ['19b4fdc.fbb16e0', 'page.Page16', 'vf-newpay-new', 'vf-newpay-form', 'vfNewPay']
]) {
  const nodes = app.logic.flows[fid].nodes;
  const values = { pageVars: { ...app.screens[page].pageVariables, valor: 100, conta: 'Vivus', datapagamento: '2026-10-08', fatura: 'nao', codigopagamento: 41, codigodespesa: 51 }, params: { codigopagamentos: '20', codigodespesa: '30' } };
  values.pageVars[prefix + 'Stage'] = undefined;
  assert(evaluate(nodes[start].inputs.condition.key, values));
  const captured = evaluate(valueExpression(nodes[snapshot]), values);
  assert.equal(captured.valor, 100);
  assert.equal(captured.conta, 'Vivus');
  values.pageVars[prefix === 'vfPay' ? 'vfPaySnapshot' : 'vfNewPayForm'] = captured;
  if (prefix === 'vfPay') {
    values.pageVars.vfPayParams = evaluate(valueExpression(nodes['vf-pay-params']), values);
    assert.equal(values.pageVars.vfPayParams.codigopagamentos, '20');
    assert(evaluate(nodes['vf-pay-valid-identifiers'].inputs.condition.key, values));
    delete values.params.codigopagamentos;
    assert(!evaluate(nodes['vf-pay-valid-identifiers'].inputs.condition.key, values));
  } else {
    values.pageVars.vfNewPayApp = { numeronegocio: '30', numerocliente: '17' };
    const body = evaluate(valueExpression(nodes['vf-newpay-before-67a01d5.84647f9']), values)[0];
    assert.equal(body.valor, 100); assert.equal(body.conta, 'Vivus'); assert.equal(body.codigopagamentos, 41);
  }
}
for (const fid of ['7b81f2e8.d45abc', 'bdb7392.ce690c8']) {
  const nodes = app.logic.flows[fid].nodes;
  for (const date of ['2026-10-08', '2026-10-08T15:00:00+01:00', 1791417600000]) {
    const values = { pageVars: { datasessao: date, fisioterapeuta: 'Teste', emailfisio: 'teste@example.invalid' } };
    assert(evaluate(nodes['vf-session-new'].inputs.condition.key, values));
    assert(evaluate(nodes['vf-session-valid-date'].inputs.condition.key, values));
    values.pageVars.vfSessionForm = evaluate(valueExpression(nodes['vf-session-form']), values);
    assert.equal(values.pageVars.vfSessionForm.fisioterapeuta, 'Teste');
    if (fid === '7b81f2e8.d45abc') { values.params = { codigonegocio: '30' }; values.appVars = { numerocliente: '17' }; }
    const id = fid === '7b81f2e8.d45abc' ? 'vf-session-before-8c85dfb8.70da88' : 'vf-session-before-2490fcd5.867164';
    const body = evaluate(valueExpression(nodes[id]), values);
    assert(!Number.isNaN(Date.parse(body.fields.scheduled_date.timestampValue)));
    assert(body.fields.scheduled_date.timestampValue.includes('T'));
  }
}
for (const width of [320, 360, 390, 550, 1280]) {
  const result = evaluate(app.expressions['4a0b049a-a5d4-56b9-8842-9c527df9de8c'], { systemVars: { dimensions: { window: { width }, screen: { width: 1920 } } } });
  assert.equal(result, Math.min(width, 550));
}
console.log(`PASS: ${Object.keys(app.logic.flows).length} flow graphs; ${expressions} expressions/dependencies; local HTML assets; payment fields/IDs; session dates; viewport sizing. No API requests.`);
