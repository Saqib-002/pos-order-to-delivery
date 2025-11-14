/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable("menu_page_associations", function (table) {
    table.dropColumn("kitchenPriority");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable("menu_page_associations", function (table) {
    table.string("kitchenPriority").defaultTo("Priority 1");
  });
}
