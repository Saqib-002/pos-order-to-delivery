/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('menu_pages', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.boolean('isDeleted').defaultTo(false);
    
    table.index(['name']);
    table.index(['isDeleted']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('menu_pages');
};
