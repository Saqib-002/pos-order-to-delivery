export async function up(knex) {
  await knex.schema.alterTable("order_items", (table) => {
    table.integer("kitchenPrintedQuantity").notNullable().defaultTo(0);
  });
  // Existing printed items must not be sent to the kitchen again after upgrading.
  await knex("order_items")
    .where("isKitchenPrinted", true)
    .update({ kitchenPrintedQuantity: knex.ref("quantity") });
}

export async function down(knex) {
  await knex.schema.alterTable("order_items", (table) => {
    table.dropColumn("kitchenPrintedQuantity");
  });
}
