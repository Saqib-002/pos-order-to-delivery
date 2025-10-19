/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('configurations', function(table) {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('address').notNullable();
    table.string('logo').notNullable();
    table.integer('lowKitchenPriorityTime')
    table.integer('mediumKitchenPriorityTime')
    table.integer('highKitchenPriorityTime')
    table.string('vatNumber');
    table.string('orderPrefix');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('configurations');
};
