/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('sub_categories', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('color').defaultTo('green');
    table.boolean('isForMenu').defaultTo(false);
    table.string('categoryId').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('categoryId').references('id').inTable('categories').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('sub_categories');
};
