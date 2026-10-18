const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const logger = { info() {}, warn() {}, error() {} };
function load(file, mocks, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/main', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { exports, require(name) { if (!(name in mocks)) throw Error(name); return mocks[name]; }, process: { env: {} }, ...globals });
  return exports;
}
const plain = value => JSON.parse(JSON.stringify(value));
test('variant edit queues option metadata before product links and their current prices', async () => {
  const jobs = [];
  const items = [{ id: 'old', name: 'Renamed', variantId: 'size' }, { id: 'new', name: 'New', variantId: 'size' }];
  const links = [{ id: 'a', productId: 'p', variantId: 'old', price: 4.5 }, { id: 'b', productId: 'p', variantId: 'new', price: 0 }];
  const db = table => ({ where: async () => items, whereIn: async (key, ids) => {
    assert.equal(table, 'products_variants'); assert.deepEqual(plain(ids), ['old', 'new']); return links;
  } });
  const sync = load('utils/sync/variants.ts', {
    '../../database/index.js': { db }, './queue/index.js': { enqueue: (...args) => jobs.push(args) }, '../logger.js': { syncLogger: logger },
  });
  await sync.syncVariantItemsForVariant('size');
  assert.deepEqual(jobs.map(j => j[0]), ['variantitem', 'variantitem', 'productvariant', 'productvariant']);
  assert.deepEqual(plain(jobs[2][2]), links[0]);
  assert.deepEqual(plain(jobs[3][2]), links[1]);
});
function processor(fetch) {
  let queue = [];
  const module = load('utils/sync/queue/processor.ts', {
    '../../logger.js': { syncLogger: logger }, './connectivity.js': { isOnline: async () => true },
    './db.js': { readQueue: () => [...queue], writeQueue: value => { queue = value; } },
  }, { fetch });
  return { ...module, add(id, price = 0) { queue.push({ id, entity: 'productvariant', operation: 'upsert', attempts: 0,
    payload: JSON.stringify({ id: 'link', productId: 'p', variantId: 'v', price }) }); }, queue: () => queue };
}
test('updates queued during HTTP sync survive and concurrent ticks do not duplicate sends', async () => {
  let release;
  const sent = [];
  const p = processor(async (_, init) => { sent.push(JSON.parse(init.body).price); await new Promise(r => { release = r; }); return { ok: true }; });
  p.add('old', 1);
  const run = p.processQueue();
  p.add('new', 5);
  await p.processQueue();
  assert.deepEqual(sent, [1]);
  release(); await run;
  assert.deepEqual(plain(p.queue().map(j => j.id)), ['new']);
  const next = p.processQueue(); release(); await next;
  assert.deepEqual(sent, [1, 5]); assert.equal(p.queue().length, 0);
});
test('failed older price updates retain newer jobs behind them until retry succeeds', async () => {
  let fail = true; const sent = [];
  const p = processor(async (_, init) => { sent.push(JSON.parse(init.body).price); return { ok: !fail, status: 500 }; });
  p.add('old', 1); p.add('new', 5);
  await p.processQueue();
  assert.deepEqual(sent, [1]); assert.deepEqual(plain(p.queue().map(j => j.id)), ['old', 'new']);
  fail = false; await p.processQueue();
  assert.deepEqual(sent, [1, 1, 5]); assert.equal(p.queue().length, 0);
});

test('variant updates sync only after commit and failed edits never publish deletions', async () => {
  for (const fail of [false, true]) {
    const calls = [];
    const handlers = load('handlers/variants.ts', {
      'electron-log': logger, './auth.js': { verifyToken: async () => {} },
      '../database/index.js': { db: () => ({ where: () => ({ select: async () => [{ id: 'removed' }] }) }) },
      '../database/variantsOperations.js': { VariantsDatabaseOperations: { updateVariant: async () => {
        calls.push('commit'); if (fail) throw Error('rollback');
      } } },
      '../utils/sync/index.js': {
        deleteVariantItemFromVPS: () => calls.push('delete'),
        syncVariantToVPS: async () => calls.push('parent'),
        syncVariantItemsForVariant: async () => calls.push('items-and-prices'),
      },
    });
    const result = await handlers.updateVariant({}, '', { id: 'size' }, []);
    assert.equal(result.status, !fail);
    assert.deepEqual(calls, fail ? ['commit'] : ['commit', 'delete', 'parent', 'items-and-prices']);
  }
});

test('replacing every option retains attached products and initializes new link prices', async () => {
  const tables = { variants: [{ id: 'size' }], variant_items: [{ id: 'old', variantId: 'size' }],
    products_variants: [{ id: 'link', productId: 'p', variantId: 'old', price: 2 }] };
  let committed = false;
  function trx(table) {
    const filters = []; let joined = false;
    const rows = () => tables[table].filter(row => filters.every(f => f(row)));
    const query = {
      where(key, value) { filters.push(row => key === 'variant_items.variantId'
        ? tables.variant_items.some(i => i.id === row.variantId && i.variantId === value) : row[key] === value); return query; },
      andWhere(key, value) { return query.where(key, value); },
      whereIn(key, values) { filters.push(row => values.includes(row[key])); return query; },
      leftJoin() { joined = true; return query; }, distinct() { return query; },
      async select() { return rows().map(row => joined ? { productId: row.productId } : { ...row }); },
      async first() { return rows()[0]; },
      async delete() { const deleted = new Set(rows()); tables[table] = tables[table].filter(row => !deleted.has(row)); },
      async update(value) { rows().forEach(row => Object.assign(row, value)); },
      async insert(value) { tables[table].push({ ...value }); },
    }; return query;
  }
  trx.commit = async () => { committed = true; }; trx.rollback = async () => {};
  let id = 0;
  const { VariantsDatabaseOperations } = load('database/variantsOperations.ts', {
    './index.js': { db: { transaction: async () => trx } }, crypto: { randomUUID: () => `new-${++id}` },
    '../utils/utils.js': { deleteImg: async () => true, uploadImg: async value => value },
    dotenv: { config() {} }, 'electron-store': class Store {},
  });
  await VariantsDatabaseOperations.updateVariant({ id: 'size', name: 'Size' }, [{ name: 'New option' }]);
  assert.equal(committed, true);
  assert.equal(tables.variant_items.length, 1);
  assert.equal(tables.products_variants.length, 1);
  assert.equal(tables.products_variants[0].productId, 'p');
  assert.equal(tables.products_variants[0].variantId, tables.variant_items[0].id);
  assert.equal(tables.products_variants[0].price, 0);
});
