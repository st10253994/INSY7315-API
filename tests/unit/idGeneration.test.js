/**
 * Unit Tests for ID Generation Utilities
 */

const { connectTestDB, closeTestDB, clearTestDB } = require('../testDbSetup');

// Mock the database client BEFORE requiring the module
jest.mock('../../database/db', () => {
  const actualDb = jest.requireActual('../../database/db');
  return {
    ...actualDb,
    client: {
      db: jest.fn(),
    },
  };
});

// Now require the module after the mock is set up
const { generateEntityId, generateBookingID, generateMaintenanceID } = require('../../util/IdGeneration/idGeneration');

describe('ID Generation Utilities', () => {
  let db;
  let mockClient;
  let connection;

  beforeAll(async () => {
    const testDB = await connectTestDB();
    db = testDB.db;
    connection = testDB.connection;
    
    // Setup mock to return our test database
    mockClient = require('../../database/db').client;
    mockClient.db.mockReturnValue(db);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('generateEntityId', () => {
    test('should generate first ID as prefix-0001', async () => {
      const id = await generateEntityId('test', 'T', 'TestCollection', 'testId');
      expect(id).toBe('T-0001');
    });

    test('should increment ID correctly', async () => {
      await db.collection('TestCollection').insertOne({ testId: 'T-0001' });
      const id = await generateEntityId('test', 'T', 'TestCollection', 'testId');
      expect(id).toBe('T-0002');
    });

    test('should handle multiple existing IDs', async () => {
      await db.collection('TestCollection').insertMany([
        { testId: 'T-0001' },
        { testId: 'T-0002' },
        { testId: 'T-0003' },
      ]);
      const id = await generateEntityId('test', 'T', 'TestCollection', 'testId');
      expect(id).toBe('T-0004');
    });

    test('should pad numbers correctly', async () => {
      await db.collection('TestCollection').insertOne({ testId: 'T-0099' });
      const id = await generateEntityId('test', 'T', 'TestCollection', 'testId');
      expect(id).toBe('T-0100');
    });

    test('should throw error on database failure', async () => {
      // Temporarily mock to throw an error
      mockClient.db.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });
      
      await expect(
        generateEntityId('test', 'T', 'TestCollection', 'testId')
      ).rejects.toThrow('Error generating test ID');
    });
  });

  describe('generateBookingID', () => {
    test('should generate booking ID with B prefix', async () => {
      const id = await generateBookingID();
      expect(id).toMatch(/^B-\d{4}$/);
      expect(id).toBe('B-0001');
    });

    test('should increment booking IDs', async () => {
      await db.collection('Bookings').insertOne({ bookingId: 'B-0001' });
      const id = await generateBookingID();
      expect(id).toBe('B-0002');
    });
  });

  describe('generateMaintenanceID', () => {
    test('should generate maintenance ID with M prefix', async () => {
      const id = await generateMaintenanceID();
      expect(id).toMatch(/^M-\d{4}$/);
      expect(id).toBe('M-0001');
    });

    test('should increment maintenance IDs', async () => {
      await db.collection('Maintenance-Requests').insertOne({ maintenanceId: 'M-0001' });
      const id = await generateMaintenanceID();
      expect(id).toBe('M-0002');
    });
  });
});
