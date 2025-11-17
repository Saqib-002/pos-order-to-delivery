/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable("order_items", function (table) {
    table.boolean('isKitchenPrinted').defaultTo(false);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable("order_items", function (table) {
    table.dropColumn('isKitchenPrinted');
  });
}
