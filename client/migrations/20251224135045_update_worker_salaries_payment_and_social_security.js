/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasPaymentType = await knex.schema.hasColumn(
    "worker_salaries",
    "paymentType"
  );

  if (!hasPaymentType) {
    await knex.schema.alterTable("worker_salaries", (table) => {
      table.string("paymentType").defaultTo("cash");
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasPaymentType = await knex.schema.hasColumn(
    "worker_salaries",
    "paymentType"
  );

  if (hasPaymentType) {
    await knex.schema.alterTable("worker_salaries", (table) => {
      table.dropColumn("paymentType");
    });
  }
}
