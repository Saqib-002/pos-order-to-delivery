/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('users', function(table) {
    table.string('id').primary();
    table.string('username').notNullable().unique();
    table.string('password').notNullable();
    table.enu('role', ['admin', 'kitchen', 'delivery', 'staff']).notNullable();
    table.string('name').notNullable();
    table.string('email');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('syncedAt');
    table.boolean('isDeleted').defaultTo(false);
    
    table.index(['username']);
    table.index(['role']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('users');
};

