/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("market_purchase_items", function (table) {
    table.string("id").primary();
    table
      .string("purchaseId")
      .references("id")
      .inTable("market_purchases")
      .onDelete("CASCADE");
    table.string("productName").notNullable();
    table.integer("box").notNullable().defaultTo(0);
    table.integer("unit").notNullable().defaultTo(0);
    table.integer("totalUnit").notNullable().defaultTo(0); // box * unit (auto calculated)
    table.decimal("unitPrice", 10, 2).notNullable().defaultTo(0.0);
    table.decimal("tax", 10, 2).notNullable().defaultTo(0.0);
    table.decimal("total", 10, 2).notNullable().defaultTo(0.0); // (price * total units) + tax
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable("market_purchase_items");
}
