/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    return knex.schema.table('configurations', function (table) {
        table.string('authorName');
        table.string('authorWebsite');
        table.string('authorEmail');
        table.string('softwareVersion');
        table.text('contactTypes'); 
        table.string('externalApiUrl'); 
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    return knex.schema.table('configurations', function (table) {
        table.dropColumn('authorName');
        table.dropColumn('authorWebsite');
        table.dropColumn('authorEmail');
        table.dropColumn('softwareVersion');
        table.dropColumn('contactTypes');
        table.dropColumn('externalApiUrl');
    });
};
