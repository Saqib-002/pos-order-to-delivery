/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return Promise.all([
    knex.schema.alterTable('categories', function(table) {
      table.string('imgUrl').nullable();
    }),
    knex.schema.alterTable('sub_categories', function(table) {
      table.string('imgUrl').nullable();
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return Promise.all([
    knex.schema.alterTable('categories', function(table) {
      table.dropColumn('imgUrl');
    }),
    knex.schema.alterTable('sub_categories', function(table) {
      table.dropColumn('imgUrl');
    })
  ]);
};