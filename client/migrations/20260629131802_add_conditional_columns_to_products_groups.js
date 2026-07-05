/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    return knex.schema.table('products_groups', function (table) {
        table.string('dependsOnGroupId').nullable();
        table.text('dependsOnItemIds').nullable();
    });
};

export async function down(knex) {
    return knex.schema.table('products_groups', function (table) {
        table.dropColumn('dependsOnGroupId');
        table.dropColumn('dependsOnItemIds');
    });
};
