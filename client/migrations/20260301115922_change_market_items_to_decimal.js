/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable("market_purchase_items", function (table) {
    table.decimal("box", 10, 2).notNullable().defaultTo(0).alter();
    table.decimal("unit", 10, 2).notNullable().defaultTo(0).alter();
    table.decimal("totalUnit", 10, 2).notNullable().defaultTo(0).alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.alterTable("market_purchase_items", function (table) {
    table.integer("box").notNullable().defaultTo(0).alter();
    table.integer("unit").notNullable().defaultTo(0).alter();
    table.integer("totalUnit").notNullable().defaultTo(0).alter();
  });
}
