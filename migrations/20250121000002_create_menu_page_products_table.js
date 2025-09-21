/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('menu_page_products', function(table) {
    table.string('id').primary();
    table.string('menuPageId').notNullable();
    table.string('productId').notNullable();
    table.string('productName').notNullable();
    table.decimal('supplement', 10, 2).defaultTo(0);
    table.integer('priority').defaultTo(0);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.foreign('menuPageId').references('id').inTable('menu_pages').onDelete('CASCADE');
    table.foreign('productId').references('id').inTable('products').onDelete('CASCADE');
    
    table.index(['menuPageId']);
    table.index(['productId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('menu_page_products');
};
