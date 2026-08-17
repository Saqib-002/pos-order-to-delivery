/**
 * Add soft-delete support to the local web_customers mirror table.
 * Mirrors the deletedAt column that exists on the VPS web_customers table.
 * The POS syncs all customers (including soft-deleted ones) from the VPS
 * so the local table must store this field.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn("web_customers", "deletedAt");
  if (!hasColumn) {
    await knex.schema.alterTable("web_customers", (table) => {
      table.timestamp("deletedAt").nullable().defaultTo(null);
      table.index(["deletedAt"], "idx_web_customers_pos_deleted_at");
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn("web_customers", "deletedAt");
  if (hasColumn) {
    await knex.schema.alterTable("web_customers", (table) => {
      table.dropIndex(["deletedAt"], "idx_web_customers_pos_deleted_at");
      table.dropColumn("deletedAt");
    });
  }
}
