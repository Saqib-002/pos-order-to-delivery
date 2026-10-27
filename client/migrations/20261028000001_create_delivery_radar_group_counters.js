/**
 * Daily counter for default custom-group names ("Group 1", "Group 2"…).
 * Numbers keep increasing through the day even when groups are deleted or
 * dispatched, and restart at 1 the next day. Shared by every POS.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable("delivery_radar_group_counters");
  if (!hasTable) {
    await knex.schema.createTable("delivery_radar_group_counters", function (table) {
      // Local calendar day of the POS, YYYY-MM-DD
      table.string("day").primary();
      table.integer("lastNumber").notNullable();
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("delivery_radar_group_counters");
}
