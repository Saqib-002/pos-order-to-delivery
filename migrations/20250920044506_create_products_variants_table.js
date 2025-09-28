/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('products_variants', function(table) {
    table.string('id').primary();
    table.float('price').notNullable().defaultTo(0);
    table.string('variantId').notNullable();
    table.string('productId').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('variantId').references('id').inTable('variant_items').onDelete('CASCADE');
    table.foreign('productId').references('id').inTable('products').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('products_variants');
};
