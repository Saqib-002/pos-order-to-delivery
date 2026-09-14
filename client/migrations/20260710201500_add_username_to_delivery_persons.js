/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    const hasColumn = await knex.schema.hasColumn('delivery_persons', 'username');
    if (!hasColumn) {
        return knex.schema.alterTable('delivery_persons', function (table) {
            table.string('username').unique().nullable();
        });
    }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    const hasColumn = await knex.schema.hasColumn('delivery_persons', 'username');
    if (hasColumn) {
        return knex.schema.alterTable('delivery_persons', function (table) {
            table.dropColumn('username');
        });
    }
}
