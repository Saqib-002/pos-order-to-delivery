/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    // Create the worker_salary_payments table
    await knex.schema.createTable("worker_salary_payments", (table) => {
        table.string("id").primary();
        table
            .string("salaryId")
            .references("id")
            .inTable("worker_salaries")
            .onDelete("CASCADE")
            .notNullable();
        table.string("paymentMethod").notNullable(); // cash, card, bizum, bank-transfer
        table.decimal("amount", 10, 2).notNullable();
        table.text("notes"); // Optional notes for the payment
        table.timestamp("paymentDate").defaultTo(knex.fn.now());
        table.timestamp("createdAt").defaultTo(knex.fn.now());
    });

    // Remove the old paymentType column from worker_salaries if it exists
    const hasPaymentType = await knex.schema.hasColumn(
        "worker_salaries",
        "paymentType"
    );
    if (hasPaymentType) {
        await knex.schema.alterTable("worker_salaries", (table) => {
            table.dropColumn("paymentType");
        });
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    // Drop the worker_salary_payments table
    await knex.schema.dropTableIfExists("worker_salary_payments");

    // Add back the paymentType column to worker_salaries
    const hasPaymentType = await knex.schema.hasColumn(
        "worker_salaries",
        "paymentType"
    );
    if (!hasPaymentType) {
        await knex.schema.alterTable("worker_salaries", (table) => {
            table.string("paymentType").defaultTo("cash");
        });
    }
};
