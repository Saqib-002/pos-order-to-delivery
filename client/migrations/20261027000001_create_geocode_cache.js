/**
 * Coordinates of geocoded delivery addresses, shared by every POS on the local
 * database so each address is only looked up online once.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable("geocode_cache");
  if (!hasTable) {
    await knex.schema.createTable("geocode_cache", function (table) {
      // Lower-cased, trimmed formatted address
      table.text("addressKey").primary();
      table.double("latitude").notNullable();
      table.double("longitude").notNullable();
      table.timestamp("createdAt").defaultTo(knex.fn.now());
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("geocode_cache");
}
