/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    await knex.schema.alterTable("configurations", function (table) {
        table.jsonb("deliveryZones").nullable();
        table.dropColumn("deliveryMinOrderRanges");
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.alterTable("configurations", function (table) {
        table.dropColumn("deliveryZones");
        table.jsonb("deliveryMinOrderRanges").nullable();
    });
}
