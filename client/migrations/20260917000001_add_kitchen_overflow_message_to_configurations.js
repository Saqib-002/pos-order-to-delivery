/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('configurations');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('configurations', 'kitchenOverflowMessage');
    if (!hasColumn) {
      return knex.schema.table('configurations', function(table) {
        table.text('kitchenOverflowMessage').nullable();
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasTable = await knex.schema.hasTable('configurations');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('configurations', 'kitchenOverflowMessage');
    if (hasColumn) {
      return knex.schema.table('configurations', function(table) {
        table.dropColumn('kitchenOverflowMessage');
      });
    }
  }
};
