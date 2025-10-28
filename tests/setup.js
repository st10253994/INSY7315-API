/**
 * Test Setup File
 * Sets up test environment variables and configurations
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Test environment variables
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/RentWise-Test';

// Cloudinary test credentials (mock values)
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud-name';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Google OAuth test credentials (mock values)
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3001/auth/google/callback';

// Arcjet test configuration (mock values)
process.env.ARCJET_KEY = 'test-arcjet-key';

// Session secret
process.env.SESSION_SECRET = 'test-session-secret';

// Increase timeout for tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
