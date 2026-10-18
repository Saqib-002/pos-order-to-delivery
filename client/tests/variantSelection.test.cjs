const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(require('node:path').join(__dirname, '../src/renderer/utils/variantSelection.ts'), 'utf8');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject });
const { filterVariantPrices } = exportsObject;
const plain = value => JSON.parse(JSON.stringify(value));

test('switching variant groups drops every old item and initializes new prices', () => {
  const previous = { small: 1, large: 2 };
  const selected = filterVariantPrices([{ id: 'regular' }, { id: 'extra' }], previous);
  assert.deepEqual(plain(selected), { regular: 0, extra: 0 });
  assert.deepEqual(previous, { small: 1, large: 2 });
});
test('save filtering removes mixed legacy attachments and preserves current prices', () => {
  const saved = filterVariantPrices([{ id: 'regular' }, { id: 'extra' }], { small: 1, regular: 0, extra: 3.5 });
  assert.deepEqual(plain(saved), { regular: 0, extra: 3.5 });
});
test('selecting None removes all variant attachments', () => {
  assert.deepEqual(plain(filterVariantPrices([], { small: 1, large: 2 })), {});
});
test('new items in the selected group start at zero while existing prices survive', () => {
  assert.deepEqual(plain(filterVariantPrices([{ id: 'small' }, { id: 'new' }], { small: 1.75 })), { small: 1.75, new: 0 });
});
