/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('configurations', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('address').notNullable();
    table.string('logo').notNullable();
    table.string('language').defaultTo('en');
    table.string('vatNumber');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('configurations');
};
