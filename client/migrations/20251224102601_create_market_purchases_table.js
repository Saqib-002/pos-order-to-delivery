/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("market_purchases", function (table) {
    table.string("id").primary();
    table
      .string("supplierId")
      .references("id")
      .inTable("suppliers")
      .onDelete("SET NULL");
    table.timestamp("ticketDate").notNullable();
    table
      .string("expenseTypeId")
      .references("id")
      .inTable("expense_types")
      .onDelete("SET NULL");
    table.string("ticketNumber").notNullable();
    table.string("paymentType").notNullable(); // 'cash', 'card', or 'mixed'
    table.decimal("totalAmount", 10, 2).notNullable().defaultTo(0.0);
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable("market_purchases");
}
