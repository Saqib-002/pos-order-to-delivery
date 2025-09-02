import { Client } from 'pg';
import knex  from 'knex';
import knexConfig from './knexfile.js';
import net from 'net';


async function testConnections() {
  console.log('🧪 Testing database connections...\n');
  
  // Test local SQLite
  console.log('1. Testing local SQLite...');
  try {
    const localDb = knex(knexConfig.development);
    await localDb.raw('SELECT 1');
    console.log('✅ Local SQLite connection successful');
    await localDb.destroy();
  } catch (error) {
    console.log('❌ Local SQLite connection failed:', error.message);
  }
  
  // Test remote PostgreSQL
  console.log('\n2. Testing remote PostgreSQL...');
  try {
    const remoteDb = knex(knexConfig.production);
    await remoteDb.raw('SELECT 1');
    console.log('✅ Remote PostgreSQL connection successful');
    
    // Test basic operations
    const result = await remoteDb.raw('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    await remoteDb.destroy();
  } catch (error) {
    console.log('❌ Remote PostgreSQL connection failed:', error.message);
    console.log('💡 Check:');
    console.log('   - PostgreSQL server is running');
    console.log('   - IP address is correct in .env');
    console.log('   - Port 5432 is accessible');
    console.log('   - Username/password are correct');
  }
  
  // Test network connectivity
  console.log('\n3. Testing network connectivity...');
  const host = process.env.PG_HOST || 'localhost';
  const port = parseInt(process.env.PG_PORT || '5432');
  
  const socket = new net.Socket();
  
  socket.setTimeout(5000);
  
  socket.on('connect', () => {
    console.log(`✅ Network connection to ${host}:${port} successful`);
    socket.destroy();
  });
  
  socket.on('timeout', () => {
    console.log(`❌ Network connection to ${host}:${port} timed out`);
    socket.destroy();
  });
  
  socket.on('error', (error) => {
    console.log(`❌ Network connection to ${host}:${port} failed:`, error.message);
  });
  
  socket.connect(port, host);
  
  // Wait a bit for connection test
  await new Promise(resolve => setTimeout(resolve, 6000));
}

// Run tests
testConnections().then(() => {
  console.log('\n🏁 Connection tests completed');
  process.exit(0);
});