/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('delivery_persons', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('email').unique();
    table.string('phone').notNullable();
    table.string('vehicleType').notNullable().defaultTo('bike');
    table.string('licenseNo').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('syncedAt');
    table.boolean('isDeleted').defaultTo(false);

    table.index(['vehicleType']);
    table.index(['name']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('delivery_persons');
};