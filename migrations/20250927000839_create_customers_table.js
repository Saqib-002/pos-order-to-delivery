/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('customers', function(table) {
    table.string('id').primary();
    table.string('phone').notNullable();
    table.string('name').notNullable();
    table.string('cif');
    table.string('email');
    table.string('comments');
    table.string('address').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('customers');
};
