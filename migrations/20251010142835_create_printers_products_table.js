/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('printers_products', function(table) {
    table.string('id').primary();
    table.string('printerId').notNullable();
    table.string('productId').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.foreign('printerId').references('id').inTable('printers').onDelete('CASCADE');
    table.foreign('productId').references('id').inTable('products').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('printers_products');
};
