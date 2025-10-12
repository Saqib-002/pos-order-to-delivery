/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("products", function (table) {
    table.string("id").primary();
    table.string("name").notNullable();
    table.float("price").notNullable();
    table.float("priority").notNullable();
    table.float("discount").notNullable();
    table.float("tax").notNullable();
    table.string("description");
    table.string("imgUrl");
    table.boolean("isAvailable");
    table.boolean("isByWeight");
    table.boolean("isDrink");
    table.boolean("isOutOfStock");
    table.boolean("isPerDiner");
    table.boolean("isPlus18");
    table.boolean("isOutstanding");
    table.boolean("isForMenu").defaultTo(false);
    table.string("subcategoryId").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());

    table
      .foreign("subcategoryId")
      .references("id")
      .inTable("sub_categories")
      .onDelete("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable("products");
}
