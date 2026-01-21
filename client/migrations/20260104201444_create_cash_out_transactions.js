/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('cash_out_transactions', table => {
        table.uuid('id').primary();
        table.string('name').notNullable();
        table.text('description');
        table.float('total').notNullable();
        table.string('paymentType').defaultTo('cash');
        table.date('date').notNullable();
        table.string('ticketId');
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTable('cash_out_transactions');
};
