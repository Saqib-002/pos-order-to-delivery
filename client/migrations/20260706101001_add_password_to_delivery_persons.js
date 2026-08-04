/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    return knex.schema.table('delivery_persons', function (table) {
        table.string('password').nullable();
    });
};

export async function down(knex) {
    return knex.schema.table('delivery_persons', function (table) {
        table.dropColumn('password');
    });
};
