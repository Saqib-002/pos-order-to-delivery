/**
 * Move bannerImgUrl from categories to sub_categories.
 * Categories no longer hold a mobile banner image; subcategories do.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Add bannerImgUrl to sub_categories
  await knex.schema.alterTable('sub_categories', function (table) {
    table.string('bannerImgUrl').nullable();
  });

  // 2. Remove bannerImgUrl from categories
  await knex.schema.alterTable('categories', function (table) {
    table.dropColumn('bannerImgUrl');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // 1. Add bannerImgUrl back to categories
  await knex.schema.alterTable('categories', function (table) {
    table.string('bannerImgUrl').nullable();
  });

  // 2. Remove bannerImgUrl from sub_categories
  await knex.schema.alterTable('sub_categories', function (table) {
    table.dropColumn('bannerImgUrl');
  });
}
