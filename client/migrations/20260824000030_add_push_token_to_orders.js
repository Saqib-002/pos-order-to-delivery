/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn("orders", "pushToken");
  if (!hasColumn) {
    await knex.schema.alterTable("orders", (table) => {
      table.string("pushToken").nullable();
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn("orders", "pushToken");
  if (hasColumn) {
    await knex.schema.alterTable("orders", (table) => {
      table.dropColumn("pushToken");
    });
  }
}
