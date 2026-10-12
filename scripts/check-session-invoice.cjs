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

const session=app.logic.flows['bdb7392.ce690c8'].nodes;
let values={pageVars:{vfSessionForm:{fisioterapeuta:' FISIO TÉSTE '}},outputs:{'vf-session-fisio-read':{records:[{fisioterapeuta:'Fisio Teste',email:'teste@example.invalid'}]}}};
const email=evaluate(valueExpression(session['aad6024e.aae958']),values);assert.equal(email,'teste@example.invalid');values.pageVars.emailfisio=email;assert(evaluate(session['vf-session-email-valid'].inputs.condition.key,values));
values.outputs['vf-session-fisio-read'].records=[];values.pageVars.emailfisio=evaluate(valueExpression(session['aad6024e.aae958']),values);assert(!evaluate(session['vf-session-email-valid'].inputs.condition.key,values));
assert.equal(session['c72c7ecc.c5375'].connections['aab5c5a6-049b-4e2b-8068-aac6d1c8cab3'][0].id,'vf-session-fisio-read');
const pay=app.logic.flows['3dd3bda.213db3d'].nodes;
values={pageVars:{valor:100,datapagamento:'2026-10-12',conta:'Teste',itp:false,numerofatura:'FT 2026/123',datafatura:'',fatura:'sim'},params:{valor:'100',datapagamento:'2026-10-12',conta:'Teste',itp:'false',codigopagamentos:'9054',codigodespesa:'null'}};
assert(evaluate(pay['vf-pay-valid-identifiers'].inputs.condition.key,values));values.pageVars.vfPayInvoiceOnly=evaluate(valueExpression(pay['vf-pay-invoice-only']),values);assert.equal(values.pageVars.vfPayInvoiceOnly,true);assert(evaluate(pay['vf-pay-after-payment'].inputs.condition.key,values));
values.pageVars.vfPaySnapshot=evaluate(valueExpression(pay['vf-pay-snapshot']),values);values.pageVars.vfPayParams=evaluate(valueExpression(pay['vf-pay-params']),values);
let body=evaluate(pay['445f0bc.d3b3e8'].inputs.body.key,values);assert.equal(body.condition.codigopagamentos,'9054');assert.equal(body.set.numerofatura,'FT 2026/123');assert.equal(body.set.fatura,'sim');assert.equal(body.set.datafatura,'');
for(const date of [undefined,null,'','null','undefined','2026-10-12']){values.pageVars.vfPaySnapshot.datafatura=date;body=evaluate(pay['445f0bc.d3b3e8'].inputs.body.key,values);assert.equal(body.set.datafatura,date==='2026-10-12'?'2026-10-12':'');}
for(const field of ['valor','datapagamento','conta','itp']){const copy={pageVars:{...values.pageVars},params:{...values.params}};copy.pageVars[field]=field==='valor'?120:field==='itp'?true:'alterado';assert(!evaluate(pay['vf-pay-valid-identifiers'].inputs.condition.key,copy));copy.params.codigodespesa='100';assert(evaluate(pay['vf-pay-valid-identifiers'].inputs.condition.key,copy));assert(!evaluate(valueExpression(pay['vf-pay-invoice-only']),copy));}
// Regression for direct-link parameters shown in the reported failure.
values={pageVars:{valor:'75',datapagamento:'2026-10-11',conta:'Vivus',itp:false,numerofatura:'123',fatura:'sim',datafatura:''},params:{valor:'75',datapagamento:'2026-10-11',conta:'Vivus',itp:'',codigopagamentos:'405752',codigodespesa:'8198'}};
assert(evaluate(pay['vf-pay-valid-identifiers'].inputs.condition.key,values));assert(evaluate(valueExpression(pay['vf-pay-invoice-only']),values));
for(const id of [undefined,null,'','null','undefined','NaN','0','-1','1 OR 1=1']){const copy={pageVars:{...values.pageVars},params:{...values.params,codigopagamentos:id}};assert(!evaluate(pay['vf-pay-valid-identifiers'].inputs.condition.key,copy));}
values.pageVars.itp=true;values.params.itp='sim';assert(evaluate(valueExpression(pay['vf-pay-invoice-only']),values));
assert(pay['vf-pay-valid-identifiers'].inputs.condition.key.functions.includes('STRING'));
console.log('PASS: therapist read before synchronization; normalized name; missing email blocked; invoice-only payment without expense ID; financial edits guarded; invoice number preserved; empty invoice dates. No API writes.');
