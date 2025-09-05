/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('order_items', function(table) {
    table.string('id').primary();
    table.string('orderId').notNullable();
    table.string('menuItemId').notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('unitPrice', 10, 2).notNullable();
    table.text('specialInstructions');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('syncedAt');
    table.boolean('isDeleted').defaultTo(false);
    
    // Foreign key constraints
    table.foreign('orderId').references('id').inTable('orders').onDelete('CASCADE');
    table.foreign('menuItemId').references('id').inTable('menu_items').onDelete('CASCADE');
    
    // Indexes
    table.index(['orderId']);
    table.index(['menuItemId']);
    table.index(['orderId', 'menuItemId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('order_items');
};