/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('web_customers', function (table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('phone').notNullable();
    // Password hash is stored so POS staff can see account exists;
    // it is never used for authentication on the POS side.
    table.string('password').notNullable();
    table.string('address');
    table.string('postalCode');
    table.string('city');
    table.string('deliveryNotes');
    table.boolean('isVerified').defaultTo(false);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['email']);
    table.index(['updatedAt']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('web_customers');
}
