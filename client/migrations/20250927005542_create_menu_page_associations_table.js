/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('menu_page_associations', function(table) {
    table.string('id').primary();
    table.string('menuId').notNullable();
    table.string('menuPageId').notNullable();
    table.string('pageName').notNullable();
    table.integer('minimum').defaultTo(1);
    table.integer('maximum').defaultTo(1);
    table.integer('priority').defaultTo(0);
    table.string('kitchenPriority').defaultTo('Priority 1');
    table.string('multiple').defaultTo('No');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.foreign('menuId').references('id').inTable('menus').onDelete('CASCADE');
    table.foreign('menuPageId').references('id').inTable('menu_pages').onDelete('CASCADE');
    
    table.index(['menuId']);
    table.index(['menuPageId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('menu_page_associations');
};
