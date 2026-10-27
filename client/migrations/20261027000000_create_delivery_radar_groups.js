/**
 * Custom delivery groups from the Delivery Radar, shared by every POS on the
 * local database. An order belongs to at most one group (orderId is the PK).
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasGroups = await knex.schema.hasTable("delivery_radar_groups");
  if (!hasGroups) {
    await knex.schema.createTable("delivery_radar_groups", function (table) {
      table.string("id").primary();
      table.string("name").notNullable();
      table.string("color").notNullable();
      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());
    });
  }

  const hasGroupOrders = await knex.schema.hasTable(
    "delivery_radar_group_orders"
  );
  if (!hasGroupOrders) {
    await knex.schema.createTable(
      "delivery_radar_group_orders",
      function (table) {
        table.string("orderId").primary();
        table
          .string("groupId")
          .notNullable()
          .references("id")
          .inTable("delivery_radar_groups")
          .onDelete("CASCADE");
        table.timestamp("createdAt").defaultTo(knex.fn.now());
        table.index(["groupId"]);
      }
    );
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("delivery_radar_group_orders");
  await knex.schema.dropTableIfExists("delivery_radar_groups");
}
