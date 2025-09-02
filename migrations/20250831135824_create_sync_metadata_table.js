/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('sync_metadata', function(table) {
    table.string('table_name').primary();
    table.timestamp('last_sync').defaultTo(knex.fn.now());
    table.integer('last_sync_revision').defaultTo(0);
    table.json('sync_config');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('sync_metadata');
};