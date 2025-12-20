/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Create Vehicles Table [cite: 62]
  await knex.schema.createTable('vehicles', function(table) {
    table.string('id').primary();
    table.string('model').notNullable();
    table.string('licensePlate').notNullable().unique();
    table.string('color');
    table.boolean('hasGps').defaultTo(false); // GPS Option [cite: 62]
    table.string('type').notNullable(); // 'bike' or 'car' [cite: 63]
    table.string('driverId').references('id').inTable('delivery_persons').onDelete('SET NULL'); // Linked to Driver [cite: 63]
    table.timestamp('itvDate'); // ITV Registration Date [cite: 64]
    table.timestamp('insuranceDate'); // Insurance Date [cite: 64]
    table.timestamp('registrationDate');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  // Create Vehicle Maintenance Table [cite: 67]
  await knex.schema.createTable('vehicle_maintenance', function(table) {
    table.string('id').primary();
    table.string('vehicleId').references('id').inTable('vehicles').onDelete('CASCADE');
    table.string('sparePart').notNullable(); // Spare Part [cite: 67]
    table.integer('unit').notNullable().defaultTo(1); // Unit [cite: 67]
    table.decimal('price', 10, 2).notNullable(); // Price [cite: 67]
    table.decimal('total', 10, 2).notNullable(); // Total [cite: 67]
    table.timestamp('date').defaultTo(knex.fn.now());
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('vehicle_maintenance');
  await knex.schema.dropTable('vehicles');
};