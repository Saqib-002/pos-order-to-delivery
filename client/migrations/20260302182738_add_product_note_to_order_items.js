/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    return knex.schema.table('order_items', function (table) {
        table.text('productNote');
    });
};

export async function down(knex) {
    return knex.schema.table('order_items', function (table) {
        table.dropColumn('productNote');
    });
};
