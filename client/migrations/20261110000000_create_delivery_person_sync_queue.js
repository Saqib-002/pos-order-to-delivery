/**
 * Shared outbox for POS delivery-person changes. Any POS connected to the
 * shared database can enqueue mutations; the master POS sends them to the
 * driver server in database order.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable("delivery_person_sync_queue");
  if (exists) return;

  await knex.schema.createTable("delivery_person_sync_queue", (table) => {
    table.increments("id").primary();
    table.string("deliveryPersonId").notNullable();
    table.text("payload").notNullable();
    table.string("operation").notNullable();
    table.string("deviceName").nullable();
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("lastError").nullable();
    table.timestamp("lastAttemptAt").nullable();
    table.timestamp("parkedAt").nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.index(["parkedAt", "id"], "delivery_person_sync_queue_pending_idx");
    table.index(["deliveryPersonId", "id"], "delivery_person_sync_queue_person_idx");
  });

  const people = await knex("delivery_persons").select(
    "id",
    "name",
    "email",
    "username",
    "phone",
    "vehicleType",
    "licenseNo",
    "password",
    "isActive",
    "createdAt",
    "updatedAt"
  );
  if (people.length > 0) {
    await knex("delivery_person_sync_queue").insert(
      people.map((person) => ({
        deliveryPersonId: person.id,
        operation: "upsert",
        payload: JSON.stringify({
          id: person.id,
          name: person.name,
          email: person.email ?? null,
          username: person.username ?? null,
          phone: person.phone ?? null,
          vehicleType: person.vehicleType ?? null,
          licenseNo: person.licenseNo ?? null,
          // This is the existing bcrypt hash, never plaintext.
          password: person.password ?? null,
          isActive: person.isActive ?? true,
          createdAt: person.createdAt ?? null,
          updatedAt: person.updatedAt ?? null,
        }),
        deviceName: "migration-backfill",
      }))
    );
  }

}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("delivery_person_sync_queue");
}
