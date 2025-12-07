/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable("orders", function (table) {
    table.string("platformId").nullable();
    table.timestamp("receivingTime").nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable("orders", function (table) {
    table.dropColumn("platformId");
    table.dropColumn("receivingTime");
  });
}
