/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
import bcrypt from 'bcrypt';

export async function seed(knex) {
  // Delete existing entries
  await knex('users').del();
  
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await knex('users').insert([
    {
      id: 'admin',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@restaurant.local',
      createdAt: new Date("9-3-2025").toISOString(),
      updatedAt: new Date("9-3-2025").toISOString()
    },
    {
      id: 'users:kitchen',
      username: 'kitchen',
      password: await bcrypt.hash('kitchen123', 10),
      role: 'kitchen',
      name: 'Kitchen Staff',
      email: 'kitchen@restaurant.local',
      createdAt: new Date("9-3-2025").toISOString(),
      updatedAt: new Date("9-3-2025").toISOString()
    },
    {
      id: 'users:delivery',
      username: 'delivery',
      password: await bcrypt.hash('delivery123', 10),
      role: 'delivery',
      name: 'Delivery Staff',
      email: 'delivery@restaurant.local',
      createdAt: new Date("9-3-2025").toISOString(),
      updatedAt: new Date("9-3-2025").toISOString()
    }
  ]);
};