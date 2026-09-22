/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS VM test harness */
// Offline component tests: no transport, provider, browser, or delivery claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/audit/ReportDeliveryActions.tsx', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
});
const state = [];
let cursor = 0;
let clipboardValue;
let printed = 0;
let rafCbs = [];
const runtime = {
  exports: {}, URL,
  window: {
    location: { origin: 'https://www.get247roi.com' },
    print: () => { printed++; },
  },
  document: {
    getElementById: () => ({
      focus: () => {},
      select: () => {},
    }),
  },
  requestAnimationFrame: (cb) => { rafCbs.push(cb); return 1; },
  navigator: { clipboard: { writeText: async value => { clipboardValue = value; } } },
  require: name => {
    if (name === 'react') return {
      useState: initial => {
        const i = cursor++;
        if (!(i in state)) state[i] = initial;
        return [state[i], value => { state[i] = value; }];
      },
      useId: () => 'fallback-id',
    };
    if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    if (name === 'next/link') return { default: 'a' };
    if (name === '@/lib/audit/report-presentation') {
      return {
        canonicalReportPath: id => `/report/${encodeURIComponent(id)}`,
        canonicalReportUrl: (origin, id) => `${origin.replace(/\/$/, '')}/report/${encodeURIComponent(id)}`,
      };
    }
    throw new Error(`Unexpected dependency: ${name}`);
  },
};
function element(type, props) { return { type, props }; }
function visit(node) {
  if (!node || typeof node !== 'object') return [];
  const children = [node.props?.children].flat(Infinity);
  return [node, ...children.flatMap(visit)];
}
function text(node) {
  if (node == null) return '';
  if (typeof node !== 'object') return String(node);
  return [node.props?.children].flat(Infinity).map(text).join(' ');
}
vm.runInNewContext(compiled.outputText, runtime);
function render(id = 'test-session') { cursor = 0; rafCbs = []; return runtime.exports.ReportDeliveryActions({ sessionId: id }); }
function button(tree, label) { return visit(tree).find(n => n.type === 'button' && text(n).includes(label)); }
(async () => {
  let tree = render();
  assert.match(text(tree), /Email delivery is not available/);
  assert.equal(visit(tree).filter(n => n.type === 'input' && n.props?.type === 'email' || n.type === 'form').length, 0);
  assert.match(tree.props.className, /print:hidden/);
  assert.match(text(tree), /anyone with the link can view/i);
  assert.equal(visit(tree).find(n => n.type === 'a').props.href, '/report/test-session');
  await button(tree, 'Copy report link').props.onClick();
  assert.equal(clipboardValue, 'https://www.get247roi.com/report/test-session');
  tree = render();
  assert.match(text(tree), /Report link copied/);
  assert.match(text(tree), /Anyone with this link/);
  runtime.navigator.clipboard.writeText = async () => { throw new Error('SECRET-provider-error'); };
  await button(tree, 'Copy report link').props.onClick();
  for (const cb of rafCbs) cb();
  tree = render();
  assert.match(text(tree), /Clipboard permission was denied|Select the link below/);
  assert.doesNotMatch(text(tree), /SECRET-provider-error/);
  const fallback = visit(tree).find(n => n.props?.['data-testid'] === 'copy-fallback-input');
  assert.ok(fallback);
  assert.equal(fallback.props.value, 'https://www.get247roi.com/report/test-session');
  assert.equal(button(tree, 'Copy report link').props.disabled, false);
  button(tree, 'Print / Save as PDF').props.onClick();
  assert.equal(printed, 1);
  tree = render();
  assert.match(text(tree), /Nothing has been emailed/);
  runtime.window.print = () => { throw new Error('private-error'); };
  button(tree, 'Print / Save as PDF').props.onClick();
  assert.match(text(render()), /Use your browser’s Print menu/);
  assert.equal(visit(render('../x?secret=yes')).find(n => n.type === 'a').props.href, '/report/..%2Fx%3Fsecret%3Dyes');
  console.log('PASS: delivery actions — copy success/denied selectable fallback, permission notice, print, no email collection; offline mocked APIs only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
