/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('groups');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('groups', 'isBold');
    if (!hasColumn) {
      return knex.schema.table('groups', function(table) {
        table.boolean('isBold').defaultTo(false);
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasTable = await knex.schema.hasTable('groups');
  if (hasTable) {
    const hasColumn = await knex.schema.hasColumn('groups', 'isBold');
    if (hasColumn) {
      return knex.schema.table('groups', function(table) {
        table.dropColumn('isBold');
      });
    }
  }
};
