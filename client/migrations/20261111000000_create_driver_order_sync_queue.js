/** Shared outbox for complete POS delivery-order snapshots. */
export async function up(knex) {
  const exists = await knex.schema.hasTable("driver_order_sync_queue");
  if (exists) return;
  await knex.schema.createTable("driver_order_sync_queue", (table) => {
    table.increments("id").primary();
    table.string("orderId").notNullable();
    table.text("payload").notNullable();
    table.string("deviceName").nullable();
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("lastError").nullable();
    table.timestamp("lastAttemptAt").nullable();
    table.timestamp("parkedAt").nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.index(["parkedAt", "id"], "driver_order_sync_pending_idx");
    table.index(["orderId", "id"], "driver_order_sync_order_idx");
  });

}

export async function down(knex) {
  await knex.schema.dropTableIfExists("driver_order_sync_queue");
}
