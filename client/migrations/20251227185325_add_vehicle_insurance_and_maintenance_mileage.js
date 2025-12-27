/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("vehicles", function (table) {
    table.string("insuranceNumber");
    table.string("insuranceCompany");
    table.decimal("insurancePrice", 10, 2);
    table.string("insurancePaymentTerm");
  });

  await knex.schema.alterTable("vehicle_maintenance", function (table) {
    table.integer("currentMileage");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("vehicle_maintenance", function (table) {
    table.dropColumn("currentMileage");
  });

  await knex.schema.alterTable("vehicles", function (table) {
    table.dropColumn("insurancePaymentTerm");
    table.dropColumn("insurancePrice");
    table.dropColumn("insuranceCompany");
    table.dropColumn("insuranceNumber");
  });
}
