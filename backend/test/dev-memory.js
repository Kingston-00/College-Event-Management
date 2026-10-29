/**
 * Runs the API against a throw-away in-memory MongoDB, pre-seeded with demo data.
 * Handy for trying the app before you have a MongoDB Atlas cluster: npm run dev:memory
 * Data is lost when the process stops.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('college_events');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_memory_secret';
  process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
  require('../server');
  await new Promise((r) => setTimeout(r, 1500));
  const result = await require('../seed/seed')();
  console.log('In-memory DB seeded:', result);
  console.log('Admin: admin@college.edu / Admin@123 | Student: aarav@college.edu / Student@123');
  process.on('SIGINT', async () => { await mongod.stop(); process.exit(0); });
})();
