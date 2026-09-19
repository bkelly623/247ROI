// Offline component tests: no transport, provider, browser, or delivery claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/audit/ReportEmail.tsx', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
});
const state = [];
let cursor = 0;
let clipboardValue;
let printed = 0;
const runtime = {
  exports: {}, URL,
  window: { location: { origin: 'https://www.get247roi.com' }, print: () => { printed++; } },
  navigator: { clipboard: { writeText: async value => { clipboardValue = value; } } },
  require: name => {
    if (name === 'react') return { useState: initial => {
      const i = cursor++;
      if (!(i in state)) state[i] = initial;
      return [state[i], value => { state[i] = value; }];
    } };
    if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    if (name === 'next/link') return { default: 'a' };
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
function render(id = 'test-session') { cursor = 0; return runtime.exports.ReportEmail({ sessionId: id }); }
function button(tree, label) { return visit(tree).find(n => n.type === 'button' && text(n) === label); }
(async () => {
  let tree = render();
  assert.match(text(tree), /Email delivery is currently unavailable/);
  assert.equal(visit(tree).filter(n => n.type === 'input' || n.type === 'form').length, 0);
  assert.match(tree.props.className, /print:hidden/);
  assert.equal(visit(tree).find(n => n.type === 'a').props.href, '/report/test-session');
  await button(tree, 'Copy report link').props.onClick();
  assert.equal(clipboardValue, 'https://www.get247roi.com/report/test-session');
  tree = render();
  assert.match(text(tree), /Report link copied/);
  assert.match(text(tree), /Keep it private/);
  runtime.navigator.clipboard.writeText = async () => { throw new Error('SECRET-provider-error'); };
  await button(tree, 'Copy report link').props.onClick();
  tree = render();
  assert.match(text(tree), /Could not copy automatically/);
  assert.doesNotMatch(text(tree), /SECRET-provider-error/);
  assert.equal(button(tree, 'Copy report link').props.disabled, false);
  button(tree, 'Print / Save as PDF').props.onClick();
  assert.equal(printed, 1);
  tree = render();
  assert.match(text(tree), /Nothing has been emailed/);
  runtime.window.print = () => { throw new Error('private-error'); };
  button(tree, 'Print / Save as PDF').props.onClick();
  assert.match(text(render()), /Use your browser’s Print menu/);
  assert.equal(visit(render('../x?secret=yes')).find(n => n.type === 'a').props.href, '/report/..%2Fx%3Fsecret%3Dyes');
  console.log('PASS: unavailable state, saved link, clipboard success/failure, private-link notice, print invocation/failure, no email collection; offline mocked browser APIs only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
