/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.table('configurations', function(table) {
    table.string('apartment');
    table.string('postalCode');
    table.string('city');
    table.string('province');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.table('configurations', function(table) {
    table.dropColumn('apartment');
    table.dropColumn('postalCode');
    table.dropColumn('city');
    table.dropColumn('province');
  });
};