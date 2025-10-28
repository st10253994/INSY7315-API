/**
 * Test Database Setup
 * Manages MongoDB Memory Server for testing
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

let mongoServer;
let connection;
let db;

/**
 * Connect to the in-memory database
 */
async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  connection = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  db = connection.db('RentWise-Test');
  
  // Update environment variable for the test
  process.env.MONGODB_URI = uri;
  
  return { connection, db };
}

/**
 * Drop database, close the connection and stop mongod
 */
async function closeTestDB() {
  if (connection) {
    await connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Remove all data from collections
 */
async function clearTestDB() {
  if (db) {
    const collections = await db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
}

/**
 * Get test database instance
 */
function getTestDB() {
  return db;
}

/**
 * Get test database connection
 */
function getTestConnection() {
  return connection;
}

module.exports = {
  connectTestDB,
  closeTestDB,
  clearTestDB,
  getTestDB,
  getTestConnection,
};
