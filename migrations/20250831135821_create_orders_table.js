/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.string('id').primary();
    table.integer('orderId');
    table.string('customerName').notNullable();
    table.string('customerPhone').notNullable();
    table.text('customerAddress').notNullable();
    table.json('items').notNullable();
    table.string('status').notNullable().defaultTo('Sent to Kitchen');
    table.string('deliveryPerson');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('cancelledAt');
    table.timestamp('deliveredAt');
    table.timestamp('syncedAt');
    table.boolean('isDeleted').defaultTo(false);
    table.decimal('totalAmount', 10, 2).defaultTo(0);
    table.text('notes');
    
    table.index(['status']);
    table.index(['customerPhone']);
    table.index(['createdAt']);
    table.index(['updatedAt']);
    table.index(['orderId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('orders');
};
