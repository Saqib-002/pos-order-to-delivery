/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('menu_items', function(table) {
    table.string('id').primary();
    table.string('name').notNullable().unique();
    table.text('description');
    table.decimal('price', 10, 2).notNullable();
    table.string('category').notNullable();
    table.boolean('isAvailable').defaultTo(true);
    table.string('ingredients');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('syncedAt');
    table.boolean('isDeleted').defaultTo(false);
    
    table.index(['category']);
    table.index(['isAvailable']);
    table.index(['name']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('menu_items');
};