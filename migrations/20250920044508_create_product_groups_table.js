/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('products_groups', function(table) {
    table.string('id').primary();
    table.integer('freeAddons').notNullable();
    table.integer('maxComplements').notNullable();
    table.integer('minComplements').notNullable();
    table.string('groupId').notNullable();
    table.string('productId').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.foreign('groupId').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('productId').references('id').inTable('products').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('products_groups');
};
