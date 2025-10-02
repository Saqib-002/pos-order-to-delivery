/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('order_items', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('category').notNullable();
    table.integer('quantity').defaultTo(1);
    table.float('price').defaultTo(0.00);
    table.string('specialInstructions').defaultTo('');
    table.string('orderId');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.foreign('orderId').references('id').inTable('orders').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('order_items');
};
