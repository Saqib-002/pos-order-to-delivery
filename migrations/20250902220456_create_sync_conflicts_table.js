/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('sync_conflicts', function(table) {
    table.increments('id').primary();
    table.string('table_name').notNullable();
    table.string('record_id').notNullable();
    table.json('local_data');
    table.json('remote_data');
    table.string('resolution_strategy').defaultTo('last_write_wins');
    table.timestamp('conflict_time').defaultTo(knex.fn.now());
    table.timestamp('resolved_at');
    table.boolean('is_resolved').defaultTo(false);
    
    table.index(['table_name']);
    table.index(['record_id']);
    table.index(['is_resolved']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    return knex.schema.dropTable('sync_conflicts');
};