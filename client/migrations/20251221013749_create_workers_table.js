/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema
    .createTable("workers", (table) => {
      table.uuid("id").primary();
      table.string("name").notNullable();
      table.date("dateOfBirth");
      table.string("idNumber"); // ID NOMBER
      table.string("phoneNumber");
      table.string("bankAccountNumber");
      table.string("bankName");
      // Salary status/Payment preference: Cash, Transfer, Half/Half
      table.string("paymentMethod").defaultTo("transfer"); 
      table.timestamps(true, true);
    })
    .createTable("worker_salaries", (table) => {
      table.uuid("id").primary();
      table.uuid("workerId").references("id").inTable("workers").onDelete("CASCADE");
      table.decimal("base", 10, 2).defaultTo(0);
      table.decimal("socialSecurityCompany", 10, 2).defaultTo(0); // SECURITY SOCIAL EMPRESA
      table.decimal("socialSecurityWorker", 10, 2).defaultTo(0);  // SECURITY SOCIAL T
      table.decimal("irpf", 10, 2).defaultTo(0);
      table.decimal("extraPayment", 10, 2).defaultTo(0);
      table.decimal("bonus", 10, 2).defaultTo(0);
      table.decimal("extraServices", 10, 2).defaultTo(0); // TRANSPORT, RENT
      table.decimal("total", 10, 2).defaultTo(0);
      table.date("date").notNullable(); // Date of salary entry
      table.timestamps(true, true);
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists("worker_salaries").dropTableIfExists("workers");
}