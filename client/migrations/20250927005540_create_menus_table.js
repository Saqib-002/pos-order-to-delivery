/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('menus', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('subcategoryId').notNullable();
    table.text('description');
    table.decimal('price', 10, 2).notNullable();
    table.string('imgUrl');
    table.integer('priority').defaultTo(0);
    table.decimal('tax', 5, 2).defaultTo(10);
    table.decimal('discount', 10, 2).defaultTo(0);
    table.boolean('outstanding').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.foreign('subcategoryId').references('id').inTable('sub_categories').onDelete('CASCADE');
    
    table.index(['name']);
    table.index(['subcategoryId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('menus');
};
