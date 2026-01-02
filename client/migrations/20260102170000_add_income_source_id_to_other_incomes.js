/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("other_incomes", function (table) {
    table
      .uuid("income_source_id")
      .nullable()
      .references("id")
      .inTable("income_sources");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("other_incomes", function (table) {
    table.dropColumn("income_source_id");
  });
};
