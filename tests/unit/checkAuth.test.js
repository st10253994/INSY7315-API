/**
 * Unit Tests for CheckAuth Middleware
 */

const { checkAuth } = require('../../Auth/checkAuth');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testDbSetup');
const { generateMockUser, generateTestToken } = require('../helpers');
const jwt = require('jsonwebtoken');

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

describe('CheckAuth Middleware', () => {
  let db;
  let mockClient;
  let req;
  let res;
  let next;

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
    
    // Setup mock request, response, and next
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('Token Validation', () => {
    test('should reject request without token', async () => {
      await checkAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await checkAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Your session is expired. Please login again.' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject expired token', async () => {
      const mockUser = generateMockUser();
      const expiredToken = jwt.sign(
        { userId: mockUser._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      await checkAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Your session is expired. Please login again.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('User Authentication', () => {
    test('should authenticate user with valid token and ObjectId', async () => {
      const mockUser = generateMockUser();
      await db.collection('System-Users').insertOne(mockUser);

      const token = generateTestToken(mockUser._id.toString());
      req.headers.authorization = `Bearer ${token}`;

      await checkAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(mockUser._id.toString());
      expect(req.user.email).toBe(mockUser.email);
      expect(req.user).not.toHaveProperty('password');
    });

    test('should reject when user not found', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011';
      const token = generateTestToken(fakeUserId);
      req.headers.authorization = `Bearer ${token}`;

      await checkAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should remove password from user object', async () => {
      const mockUser = generateMockUser({ password: 'hashed-password' });
      await db.collection('System-Users').insertOne(mockUser);

      const token = generateTestToken(mockUser._id.toString());
      req.headers.authorization = `Bearer ${token}`;

      await checkAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).not.toHaveProperty('password');
    });
  });

  describe('Profile Integration', () => {
    test('should attach empty profile if no profile exists', async () => {
      const mockUser = generateMockUser();
      await db.collection('System-Users').insertOne(mockUser);

      const token = generateTestToken(mockUser._id.toString());
      req.headers.authorization = `Bearer ${token}`;

      await checkAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.profile).toEqual({});
      expect(req.user.preferredLanguage).toBe('en');
    });

    test('should attach profile if profile exists', async () => {
      const mockUser = generateMockUser();
      await db.collection('System-Users').insertOne(mockUser);

      const mockProfile = {
        userId: mockUser._id,
        profile: {
          firstName: 'John',
          surname: 'Doe',
          preferredLanguage: 'es',
        },
      };
      await db.collection('User-Settings').insertOne(mockProfile);

      const token = generateTestToken(mockUser._id.toString());
      req.headers.authorization = `Bearer ${token}`;

      await checkAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.profile).toEqual(mockProfile.profile);
      expect(req.user.preferredLanguage).toBe('es');
    });

    test('should default preferredLanguage to en if not in profile', async () => {
      const mockUser = generateMockUser();
      await db.collection('System-Users').insertOne(mockUser);

      const mockProfile = {
        userId: mockUser._id,
        profile: {
          firstName: 'John',
          surname: 'Doe',
        },
      };
      await db.collection('User-Settings').insertOne(mockProfile);

      const token = generateTestToken(mockUser._id.toString());
      req.headers.authorization = `Bearer ${token}`;

      await checkAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.preferredLanguage).toBe('en');
    });
  });

  describe('Google OAuth Integration', () => {
    test('should authenticate user with googleId', async () => {
      const mockUser = generateMockUser({
        googleId: 'google-123456',
        email: 'google@example.com',
      });
      await db.collection('System-Users').insertOne(mockUser);

      // Token with googleId instead of ObjectId
      const token = jwt.sign(
        { userId: 'google-123456', email: 'google@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers.authorization = `Bearer ${token}`;

      await checkAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.googleId).toBe('google-123456');
    });

    test('should authenticate user with email fallback', async () => {
      const mockUser = generateMockUser({
        email: 'emailfallback@example.com',
      });
      await db.collection('System-Users').insertOne(mockUser);

      // Token with invalid ObjectId but valid email
      const token = jwt.sign(
        { userId: 'invalid-id', email: 'emailfallback@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers.authorization = `Bearer ${token}`;

      await checkAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('emailfallback@example.com');
    });
  });

  describe('Authorization Header Formats', () => {
    test('should handle Bearer token format', async () => {
      const mockUser = generateMockUser();
      await db.collection('System-Users').insertOne(mockUser);

      const token = generateTestToken(mockUser._id.toString());
      req.headers.authorization = `Bearer ${token}`;

      await checkAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject malformed authorization header', async () => {
      const mockUser = generateMockUser();
      const token = generateTestToken(mockUser._id.toString());
      req.headers.authorization = token; // Missing "Bearer"

      await checkAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
