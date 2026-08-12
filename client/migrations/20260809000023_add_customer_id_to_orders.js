/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn("orders", "customerId");
  if (!hasColumn) {
    return knex.schema.alterTable("orders", function (table) {
      table
        .string("customerId")
        .nullable()
        .references("id")
        .inTable("web_customers")
        .onDelete("SET NULL");
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn("orders", "customerId");
  if (hasColumn) {
    return knex.schema.alterTable("orders", function (table) {
      table.dropColumn("customerId");
    });
  }
}
