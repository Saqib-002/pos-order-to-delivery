/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("expenses", function (table) {
    table.string("id").primary();
    table.string("name").notNullable();
    table.text("description");
    table.decimal("total", 10, 2).notNullable().defaultTo(0.0);
    table.string("paymentType").notNullable(); // 'cash', 'card', or 'mixed'
    table.timestamp("date").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable("expenses");
}
