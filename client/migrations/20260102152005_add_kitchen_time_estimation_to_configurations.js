/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("configurations", function (table) {
    table.json("kitchenTimeEstimationRanges").nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("configurations", function (table) {
    table.dropColumn("kitchenTimeEstimationRanges");
  });
};
