/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    const hasColumn = await knex.schema.hasColumn('delivery_persons', 'password');
    if (!hasColumn) {
        return knex.schema.table('delivery_persons', function (table) {
            table.string('password').nullable();
        });
    }
};

export async function down(knex) {
    const hasColumn = await knex.schema.hasColumn('delivery_persons', 'password');
    if (hasColumn) {
        return knex.schema.table('delivery_persons', function (table) {
            table.dropColumn('password');
        });
    }
};
