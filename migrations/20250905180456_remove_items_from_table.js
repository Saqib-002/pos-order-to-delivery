/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable('orders', function(table) {
    // Add total amount and remove items JSON column
    table.decimal('totalAmount', 10, 2).defaultTo(0);
    table.text('notes'); // General order notes
    
    table.dropColumn('items');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable('orders', function(table) {
    table.dropColumn('totalAmount');
    table.dropColumn('notes');
    table.json('items').notNullable();
  });
};