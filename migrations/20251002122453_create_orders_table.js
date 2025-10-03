/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.string('id').primary();
    table.string('orderId');
    table.string('customerName');
    table.string('customerPhone');
    table.string('customerCIF');
    table.string('customerEmail');
    table.string('customerAddress');
    table.string('customerComments');
    table.string('notes');
    table.string('orderType');
    table.boolean('isPaid').defaultTo(false);
    table.string('paymentType');
    table.string('status').defaultTo('pending');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('orders');
};
