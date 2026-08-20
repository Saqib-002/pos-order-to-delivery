/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable('categories', function(table) {
    table.integer('priority').defaultTo(0);
    table.string('bannerImgUrl').nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable('categories', function(table) {
    table.dropColumn('priority');
    table.dropColumn('bannerImgUrl');
  });
}
