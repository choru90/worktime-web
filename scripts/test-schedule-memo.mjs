import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

// Execute the real form submit handler; replace only React state and the HTTP boundary.
async function submit(component, memo) {
  const isCalendar = component === 'AddScheduleModal';
  const formData = { workerId: 'synthetic-worker', date: '2026-11-27', startTime: '20:00', endTime: '21:00', memo };
  const values = isCalendar ? ['synthetic-worker', '20:00', '21:00', memo, false] : [formData, false, ''];
  const requests = []; let completed = 0;
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(`../src/pages/Schedule/${component}.tsx`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, console, alert: message => { throw Error(message); }, require: name => {
    if (name === 'react') return { useState: () => [values.shift(), () => {}] };
    if (name === 'react/jsx-runtime') return jsx;
    if (name === '../../lib/apiClient') return { default: { post: async (path, body) => { requests.push({ path, body }); } }, __esModule: true };
    throw Error(`Unexpected import ${name}`);
  } });
  const tree = exports[component]({ date: new Date(2026, 10, 27), workers: [], onClose() {}, onCancel() {}, onCreated() { completed++; }, onSubmit() { completed++; } });
  function form(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'form') return node;
    for (const child of [node.props?.children].flat(Infinity)) { const found = form(child); if (found) return found; }
  }
  await form(tree).props.onSubmit({ preventDefault() {} });
  assert.equal(completed, 1); assert.equal(requests.length, 1);
  return JSON.parse(JSON.stringify(requests[0]));
}
for (const component of ['ScheduleForm', 'AddScheduleModal']) {
  test(`${component} sends the entered memo with the unchanged owner proposal contract`, async () => {
    assert.deepEqual(await submit(component, '마감 인수인계\n<텍스트> & 준비'), {
      path: '/workers/synthetic-worker/schedules',
      body: { workerId: 'synthetic-worker', startAtUtc: '2026-11-27T20:00:00+09:00', endAtUtc: '2026-11-27T21:00:00+09:00', timezone: 'Asia/Seoul', requestType: 'OWNER_PROPOSAL', memo: '마감 인수인계\n<텍스트> & 준비' },
    });
  });
  test(`${component} leaves a blank optional memo out of the request`, async () => {
    assert.equal(Object.hasOwn((await submit(component, '')).body, 'memo'), false);
  });
}
