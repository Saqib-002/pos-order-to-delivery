/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable("products_allergens");
  if (!hasTable) {
    return knex.schema.createTable("products_allergens", function (table) {
      table.string("id").primary();
      table.string("productId").notNullable();
      table.string("allergenId").notNullable();
      table.string("type").notNullable().defaultTo("contains");
      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());
      table.unique(["productId", "allergenId"]);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists("products_allergens");
}
