/**
 * Unit Tests for Profile Service
 */

const profileService = require('../../service/profileService');
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

describe('Profile Service', () => {
  let db;
  let mockClient;

  beforeAll(async () => {
    const testDB = await connectTestDB();
    db = testDB.db;
    
    mockClient = require('../../database/db').client;
    mockClient.db.mockReturnValue(db);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('getProfileById', () => {
    test('should return user profile by ID', async () => {
      const mockUser = generateMockUser();
      const mockProfile = {
        userId: mockUser._id,
        profile: {
          firstName: 'John',
          surname: 'Doe',
          email: mockUser.email,
          notifications: true,
          offlineSync: false,
        },
        updatedAt: new Date(),
      };
      
      await db.collection('User-Settings').insertOne(mockProfile);

      const profile = await profileService.getProfileById(mockUser._id.toString());
      
      expect(profile).toBeDefined();
      expect(profile.userId.toString()).toBe(mockUser._id.toString());
      expect(profile.profile).toHaveProperty('firstName', 'John');
      expect(profile.profile).toHaveProperty('surname', 'Doe');
    });

    test('should throw error when profile not found', async () => {
      const fakeUserId = new ObjectId();
      
      await expect(
        profileService.getProfileById(fakeUserId.toString())
      ).rejects.toThrow('User not found');
    });

    test('should handle ObjectId instances', async () => {
      const mockUser = generateMockUser();
      const mockProfile = {
        userId: mockUser._id,
        profile: {
          firstName: 'John',
          surname: 'Doe',
          email: mockUser.email,
        },
        updatedAt: new Date(),
      };
      
      await db.collection('User-Settings').insertOne(mockProfile);

      const profile = await profileService.getProfileById(mockUser._id);
      
      expect(profile).toBeDefined();
      expect(profile.userId.toString()).toBe(mockUser._id.toString());
    });
  });

  describe('postUserProfile', () => {
    test('should create new user profile', async () => {
      const mockUser = generateMockUser();
      const profileData = {
        firstName: 'John',
        surname: 'Doe',
        email: mockUser.email,
        notifications: true,
        offlineSync: false,
      };

      const result = await profileService.postUserProfile(mockUser._id.toString(), profileData);

      expect(result).toHaveProperty('message', 'Profile Updated Successfully');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('profile');
      expect(result).toHaveProperty('updatedAt');
      expect(result.profile.firstName).toBe('John');
      expect(result.profile.surname).toBe('Doe');

      // Verify in database
      const savedProfile = await db.collection('User-Settings').findOne({ userId: mockUser._id });
      expect(savedProfile).toBeDefined();
      expect(savedProfile.profile.firstName).toBe('John');
    });

    test('should update existing user profile', async () => {
      const mockUser = generateMockUser();
      const initialProfile = {
        userId: mockUser._id,
        profile: {
          firstName: 'John',
          surname: 'Doe',
          email: mockUser.email,
        },
        updatedAt: new Date(),
      };
      
      await db.collection('User-Settings').insertOne(initialProfile);

      const updateData = {
        firstName: 'Jane',
        surname: 'Smith',
      };

      const result = await profileService.postUserProfile(mockUser._id.toString(), updateData);

      expect(result.profile.firstName).toBe('Jane');
      expect(result.profile.surname).toBe('Smith');
      expect(result.profile.email).toBe(mockUser.email); // Should preserve existing email
    });

    test('should handle boolean fields correctly', async () => {
      const mockUser = generateMockUser();
      const profileData = {
        firstName: 'John',
        surname: 'Doe',
        notifications: 'true',
        offlineSync: 'false',
      };

      const result = await profileService.postUserProfile(mockUser._id.toString(), profileData);

      expect(result.profile.notifications).toBe(true);
      expect(result.profile.offlineSync).toBe(false);
    });

    test('should default boolean fields to false if not provided', async () => {
      const mockUser = generateMockUser();
      const profileData = {
        firstName: 'John',
        surname: 'Doe',
      };

      const result = await profileService.postUserProfile(mockUser._id.toString(), profileData);

      expect(result.profile.notifications).toBe(false);
      expect(result.profile.offlineSync).toBe(false);
    });

    test('should merge with existing profile data', async () => {
      const mockUser = generateMockUser();
      const initialProfile = {
        userId: mockUser._id,
        profile: {
          firstName: 'John',
          surname: 'Doe',
          email: mockUser.email,
          phoneNumber: '123-456-7890',
          notifications: true,
        },
        updatedAt: new Date(),
      };
      
      await db.collection('User-Settings').insertOne(initialProfile);

      const updateData = {
        firstName: 'Jane',
      };

      const result = await profileService.postUserProfile(mockUser._id.toString(), updateData);

      expect(result.profile.firstName).toBe('Jane');
      expect(result.profile.surname).toBe('Doe'); // Preserved
      expect(result.profile.email).toBe(mockUser.email); // Preserved
      expect(result.profile.phoneNumber).toBe('123-456-7890'); // Preserved
      expect(result.profile.notifications).toBe(true); // Preserved
    });

    test('should update timestamp', async () => {
      const mockUser = generateMockUser();
      const profileData = {
        firstName: 'John',
        surname: 'Doe',
      };

      const result = await profileService.postUserProfile(mockUser._id.toString(), profileData);

      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    test('should perform upsert operation', async () => {
      const mockUser = generateMockUser();
      const profileData = {
        firstName: 'John',
        surname: 'Doe',
      };

      // First call should create
      await profileService.postUserProfile(mockUser._id.toString(), profileData);

      // Verify only one document exists
      const profiles = await db.collection('User-Settings').find({ userId: mockUser._id }).toArray();
      expect(profiles).toHaveLength(1);

      // Second call should update, not create a new one
      await profileService.postUserProfile(mockUser._id.toString(), { firstName: 'Jane' });

      const updatedProfiles = await db.collection('User-Settings').find({ userId: mockUser._id }).toArray();
      expect(updatedProfiles).toHaveLength(1);
      expect(updatedProfiles[0].profile.firstName).toBe('Jane');
    });
  });
});
