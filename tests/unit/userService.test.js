/**
 * Unit Tests for User Service
 */

const userService = require('../../service/userService');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testDbSetup');
const { hashPassword } = require('../helpers');

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

describe('User Service', () => {
  let db;
  let mockClient;

  beforeAll(async () => {
    const testDB = await connectTestDB();
    db = testDB.db;
    
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

  describe('registerUser', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Test123!',
        firstName: 'John',
        surname: 'Doe',
      };

      const result = await userService.registerUser(userData);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
      expect(result.firstName).toBe(userData.firstName);
      expect(result.surname).toBe(userData.surname);
      expect(result.role).toBe('tenant');
      expect(result).not.toHaveProperty('password');

      // Verify user was inserted in database
      const usersCollection = db.collection('System-Users');
      const insertedUser = await usersCollection.findOne({ email: userData.email });
      expect(insertedUser).toBeDefined();
      expect(insertedUser.password).not.toBe(userData.password); // Password should be hashed
    });

    test('should throw error when required fields are missing', async () => {
      const userData = {
        email: 'test@example.com',
        // Missing password, firstName, surname
      };

      await expect(userService.registerUser(userData)).rejects.toThrow('All fields are required');
    });

    test('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123!',
        firstName: 'John',
        surname: 'Doe',
      };

      await expect(userService.registerUser(userData)).rejects.toThrow();
    });

    test('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        surname: 'Doe',
      };

      await expect(userService.registerUser(userData)).rejects.toThrow();
    });

    test('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Test123!',
        firstName: 'John',
        surname: 'Doe',
      };

      // Register user first time
      await userService.registerUser(userData);

      // Try to register again
      await expect(userService.registerUser(userData)).rejects.toThrow('User already exists');
    });

    test('should hash password before storing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'John',
        surname: 'Doe',
      };

      await userService.registerUser(userData);

      const usersCollection = db.collection('System-Users');
      const user = await usersCollection.findOne({ email: userData.email });
      
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const usersCollection = db.collection('System-Users');
      const hashedPassword = await hashPassword('Test123!');
      await usersCollection.insertOne({
        email: 'testuser@example.com',
        password: hashedPassword,
        firstName: 'Test',
        surname: 'User',
        role: 'tenant',
      });
    });

    test('should login user with valid credentials', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'Test123!',
      };

      const result = await userService.loginUser(credentials);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('userId');
      expect(typeof result.token).toBe('string');
    });

    test('should throw error when email is missing', async () => {
      const credentials = {
        password: 'Test123!',
      };

      await expect(userService.loginUser(credentials)).rejects.toThrow('Email and password are required');
    });

    test('should throw error when password is missing', async () => {
      const credentials = {
        email: 'testuser@example.com',
      };

      await expect(userService.loginUser(credentials)).rejects.toThrow('Email and password are required');
    });

    test('should throw error for non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'Test123!',
      };

      await expect(userService.loginUser(credentials)).rejects.toThrow('Invalid email or password');
    });

    test('should throw error for incorrect password', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'WrongPass123!',
      };

      await expect(userService.loginUser(credentials)).rejects.toThrow('Invalid email or password');
    });

    test('should return valid JWT token', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'Test123!',
      };

      const result = await userService.loginUser(credentials);
      const jwt = require('jsonwebtoken');
      
      expect(() => {
        jwt.verify(result.token, process.env.JWT_SECRET);
      }).not.toThrow();
    });

    test('should include userId in token payload', async () => {
      const credentials = {
        email: 'testuser@example.com',
        password: 'Test123!',
      };

      const result = await userService.loginUser(credentials);
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      
      expect(decoded).toHaveProperty('userId');
      expect(decoded.userId).toBe(result.userId.toString());
    });
  });
});
