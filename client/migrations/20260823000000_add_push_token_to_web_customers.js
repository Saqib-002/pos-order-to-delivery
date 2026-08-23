/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn("web_customers", "pushToken");
  if (!hasColumn) {
    await knex.schema.alterTable("web_customers", (table) => {
      table.string("pushToken").nullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn("web_customers", "pushToken");
  if (hasColumn) {
    await knex.schema.alterTable("web_customers", (table) => {
      table.dropColumn("pushToken");
    });
  }
};
