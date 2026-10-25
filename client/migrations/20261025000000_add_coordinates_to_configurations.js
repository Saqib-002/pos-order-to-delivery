/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('configurations');
  if (hasTable) {
    const hasLatitude = await knex.schema.hasColumn('configurations', 'latitude');
    const hasLongitude = await knex.schema.hasColumn('configurations', 'longitude');
    if (!hasLatitude || !hasLongitude) {
      return knex.schema.table('configurations', function(table) {
        if (!hasLatitude) table.double('latitude').nullable();
        if (!hasLongitude) table.double('longitude').nullable();
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
    const hasLatitude = await knex.schema.hasColumn('configurations', 'latitude');
    const hasLongitude = await knex.schema.hasColumn('configurations', 'longitude');
    if (hasLatitude || hasLongitude) {
      return knex.schema.table('configurations', function(table) {
        if (hasLatitude) table.dropColumn('latitude');
        if (hasLongitude) table.dropColumn('longitude');
      });
    }
  }
};
