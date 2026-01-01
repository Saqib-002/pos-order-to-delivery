/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.table("market_purchase_items", function (table) {
    table
      .string("expenseTypeId")
      .references("id")
      .inTable("expense_types")
      .onDelete("SET NULL");
    table.boolean("isTaxIncluded").defaultTo(false);
  });

  await knex.raw(`
    UPDATE market_purchase_items
    SET "expenseTypeId" = (
      SELECT "expenseTypeId" 
      FROM market_purchases 
      WHERE market_purchases.id = market_purchase_items."purchaseId"
    )
  `);

  await knex.schema.table("market_purchases", function (table) {
    table.dropColumn("expenseTypeId");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.table("market_purchases", function (table) {
    table
      .string("expenseTypeId")
      .references("id")
      .inTable("expense_types")
      .onDelete("SET NULL");
  });

  await knex.raw(`
    UPDATE market_purchases
    SET "expenseTypeId" = (
      SELECT "expenseTypeId" 
      FROM market_purchase_items 
      WHERE market_purchase_items."purchaseId" = market_purchases.id
      LIMIT 1
    )
  `);

  await knex.schema.table("market_purchase_items", function (table) {
    table.dropColumn("expenseTypeId");
    table.dropColumn("isTaxIncluded");
  });
}