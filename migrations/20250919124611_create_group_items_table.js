/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('group_items', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.float('price').notNullable();
    table.integer('priority').notNullable();
    table.integer('imgUrl');
    table.string('groupId').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('groupId').references('id').inTable('groups').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('group_items');
};
