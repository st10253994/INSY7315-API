/**
 * Test Helper Functions
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

/**
 * Generate a valid JWT token for testing
 */
function generateTestToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Generate a mock user object
 */
function generateMockUser(overrides = {}) {
  return {
    _id: new ObjectId(),
    email: 'test@example.com',
    firstName: 'Test',
    surname: 'User',
    role: 'tenant',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock listing object
 */
function generateMockListing(overrides = {}) {
  return {
    _id: new ObjectId(),
    title: 'Test Listing',
    address: '123 Test Street',
    description: 'A nice test property',
    price: 1000,
    amenities: ['WiFi', 'Parking'],
    imagesURL: ['https://example.com/image1.jpg'],
    landlordInfo: {
      landlordId: new ObjectId(),
      name: 'Test Landlord',
    },
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock booking object
 */
function generateMockBooking(userId, listingId, overrides = {}) {
  return {
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    listingDetail: {
      listingID: new ObjectId(listingId),
    },
    newBooking: {
      bookingId: 'B-0001',
      checkInDate: '2025-11-01',
      checkOutDate: '2025-11-15',
      numberOfGuests: 2,
      supportDocuments: [],
      totalPrice: 15000,
      status: 'Pending',
      createdAt: new Date(),
    },
    ...overrides,
  };
}

/**
 * Generate a mock review object
 */
function generateMockReview(userId, listingId, overrides = {}) {
  return {
    _id: new ObjectId(),
    listingId: new ObjectId(listingId),
    userId: new ObjectId(userId),
    rating: 5,
    comment: 'Great place!',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Hash a password for testing
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Create test database collections with initial data
 */
async function seedTestDatabase(db, data = {}) {
  const collections = {
    'System-Users': data.users || [],
    'Listings': data.listings || [],
    'Bookings': data.bookings || [],
    'Reviews': data.reviews || [],
    'Favourites': data.favourites || [],
    'System-Notifications': data.notifications || [],
    'Maintenance-Requests': data.maintenanceRequests || [],
    'User-Settings': data.userSettings || [],
  };

  for (const [collectionName, documents] of Object.entries(collections)) {
    if (documents.length > 0) {
      await db.collection(collectionName).insertMany(documents);
    }
  }
}

/**
 * Wait for a specified amount of time
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  generateTestToken,
  generateMockUser,
  generateMockListing,
  generateMockBooking,
  generateMockReview,
  hashPassword,
  seedTestDatabase,
  delay,
};
