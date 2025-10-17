/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('variant_items', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string("imgUrl");
    table.integer('priority').notNullable();
    table.string('variantId').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('variantId').references('id').inTable('variants').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('variant_items');
};
