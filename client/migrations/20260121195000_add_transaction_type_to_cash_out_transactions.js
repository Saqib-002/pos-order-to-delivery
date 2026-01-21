/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.table('cash_out_transactions', table => {
        table.string('transactionType').defaultTo('out');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.table('cash_out_transactions', table => {
        table.dropColumn('transactionType');
    });
};
