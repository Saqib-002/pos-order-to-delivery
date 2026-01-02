/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("inventory_products", function (table) {
    table
      .string("expenseTypeId")
      .references("id")
      .inTable("expense_types")
      .onDelete("SET NULL");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("inventory_products", function (table) {
    table.dropColumn("expenseTypeId");
  });
}
