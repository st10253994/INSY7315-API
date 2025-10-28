/**
 * Unit Tests for Google Sign-In Service
 */

const { googleSignInService } = require('../../service/googleSignInService');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testDbSetup');
const { generateMockUser } = require('../helpers');
const { ObjectId } = require('mongodb');

// Mock the database client
jest.mock('../../database/db', () => {
  const actualDb = jest.requireActual('../../database/db');
  return {
    ...actualDb,
    client: {
      db: jest.fn(),
    },
  };
});

describe('Google Sign-In Service', () => {
  let db;
  let mockClient;
  let service;

  beforeAll(async () => {
    const testDB = await connectTestDB();
    db = testDB.db;
    
    mockClient = require('../../database/db').client;
    mockClient.db.mockReturnValue(db);
    
    service = new googleSignInService();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('findUserByGoogleId', () => {
    test('should find user by Google ID', async () => {
      const mockUser = generateMockUser({
        googleId: 'google-123456',
        email: 'google@example.com',
      });
      
      await db.collection('System-Users').insertOne(mockUser);

      const foundUser = await service.findUserByGoogleId('google-123456');
      
      expect(foundUser).toBeDefined();
      expect(foundUser.googleId).toBe('google-123456');
      expect(foundUser.email).toBe('google@example.com');
    });

    test('should return null if user not found', async () => {
      const foundUser = await service.findUserByGoogleId('non-existent-google-id');
      expect(foundUser).toBeNull();
    });

    test('should not find user with different Google ID', async () => {
      const mockUser = generateMockUser({
        googleId: 'google-123456',
        email: 'google@example.com',
      });
      
      await db.collection('System-Users').insertOne(mockUser);

      const foundUser = await service.findUserByGoogleId('google-different');
      expect(foundUser).toBeNull();
    });
  });

  describe('createUser', () => {
    test('should create new user with Google data', async () => {
      const userData = {
        googleId: 'google-123456',
        name: 'John Doe',
        email: 'john.doe@example.com',
        pfpImage: 'https://example.com/profile.jpg',
      };

      const result = await service.createUser(userData);

      expect(result).toHaveProperty('_id');
      expect(result.googleId).toBe('google-123456');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.pfpImage).toBe('https://example.com/profile.jpg');
      expect(result).toHaveProperty('createdAt');

      // Verify user in database
      const savedUser = await db.collection('System-Users').findOne({ googleId: 'google-123456' });
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe('john.doe@example.com');
    });

    test('should create user profile when creating user', async () => {
      const userData = {
        googleId: 'google-123456',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        pfpImage: 'https://example.com/jane.jpg',
      };

      const result = await service.createUser(userData);

      // Verify profile was created
      const profile = await db.collection('User-Settings').findOne({ userId: result._id });
      expect(profile).toBeDefined();
      expect(profile.profile.firstName).toBe('Jane');
      expect(profile.profile.surname).toBe('Smith');
      expect(profile.profile.email).toBe('jane.smith@example.com');
      expect(profile.profile.pfpImage).toBe('https://example.com/jane.jpg');
    });

    test('should split name into firstName and surname', async () => {
      const userData = {
        googleId: 'google-123456',
        name: 'Alice Wonder',
        email: 'alice@example.com',
        pfpImage: 'https://example.com/alice.jpg',
      };

      const result = await service.createUser(userData);

      const profile = await db.collection('User-Settings').findOne({ userId: result._id });
      expect(profile.profile.firstName).toBe('Alice');
      expect(profile.profile.surname).toBe('Wonder');
    });

    test('should handle single name', async () => {
      const userData = {
        googleId: 'google-123456',
        name: 'Madonna',
        email: 'madonna@example.com',
        pfpImage: 'https://example.com/madonna.jpg',
      };

      const result = await service.createUser(userData);

      const profile = await db.collection('User-Settings').findOne({ userId: result._id });
      expect(profile.profile.firstName).toBe('Madonna');
      // surname will be null or undefined when splitting single name
      expect(profile.profile.surname).toBeNull();
    });

    test('should add createdAt timestamp', async () => {
      const userData = {
        googleId: 'google-123456',
        name: 'Test User',
        email: 'test@example.com',
        pfpImage: 'https://example.com/test.jpg',
      };

      const result = await service.createUser(userData);

      expect(result.createdAt).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);

      const savedUser = await db.collection('System-Users').findOne({ googleId: 'google-123456' });
      expect(savedUser.createdAt).toBeDefined();
    });
  });

  describe('getUserById', () => {
    test('should find user by database ID', async () => {
      const mockUser = generateMockUser({
        googleId: 'google-123456',
        email: 'google@example.com',
      });
      
      await db.collection('System-Users').insertOne(mockUser);

      const foundUser = await service.getUserById(mockUser._id.toString());
      
      expect(foundUser).toBeDefined();
      expect(foundUser._id.toString()).toBe(mockUser._id.toString());
      expect(foundUser.email).toBe('google@example.com');
    });

    test('should return null if user not found', async () => {
      const fakeId = new ObjectId();
      const foundUser = await service.getUserById(fakeId.toString());
      expect(foundUser).toBeNull();
    });

    test('should handle ObjectId instances', async () => {
      const mockUser = generateMockUser({
        googleId: 'google-123456',
        email: 'google@example.com',
      });
      
      await db.collection('System-Users').insertOne(mockUser);

      const foundUser = await service.getUserById(mockUser._id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser._id.toString()).toBe(mockUser._id.toString());
    });

    test('should throw error for invalid ID format', async () => {
      await expect(
        service.getUserById('invalid-id')
      ).rejects.toThrow('Invalid ID format');
    });
  });

  describe('Integration', () => {
    test('should handle complete sign-in flow for new user', async () => {
      const googleId = 'google-new-user';
      
      // Check if user exists
      let user = await service.findUserByGoogleId(googleId);
      expect(user).toBeNull();

      // Create new user
      const userData = {
        googleId: googleId,
        name: 'New User',
        email: 'newuser@example.com',
        pfpImage: 'https://example.com/new.jpg',
      };
      
      const createdUser = await service.createUser(userData);
      expect(createdUser).toHaveProperty('_id');

      // Find user again
      user = await service.findUserByGoogleId(googleId);
      expect(user).toBeDefined();
      expect(user.email).toBe('newuser@example.com');

      // Verify can get by database ID
      const userById = await service.getUserById(createdUser._id);
      expect(userById).toBeDefined();
      expect(userById.googleId).toBe(googleId);
    });

    test('should handle complete sign-in flow for existing user', async () => {
      const googleId = 'google-existing-user';
      
      // Create user first
      const userData = {
        googleId: googleId,
        name: 'Existing User',
        email: 'existing@example.com',
        pfpImage: 'https://example.com/existing.jpg',
      };
      
      await service.createUser(userData);

      // Find existing user
      const user = await service.findUserByGoogleId(googleId);
      expect(user).toBeDefined();
      expect(user.email).toBe('existing@example.com');
    });
  });
});
