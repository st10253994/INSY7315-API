/**
 * Unit Tests for Listing Service
 */

const listingService = require('../../service/listingService');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testDbSetup');
const { generateMockListing } = require('../helpers');
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

describe('Listing Service', () => {
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

  describe('getAllListings', () => {
    test('should return empty array when no listings exist', async () => {
      const listings = await listingService.getAllListings();
      expect(listings).toEqual([]);
    });

    test('should return all listings', async () => {
      const listingsCollection = db.collection('Listings');
      const mockListings = [
        generateMockListing(),
        generateMockListing({ title: 'Second Listing' }),
        generateMockListing({ title: 'Third Listing' }),
      ];
      
      await listingsCollection.insertMany(mockListings);

      const listings = await listingService.getAllListings();
      expect(listings).toHaveLength(3);
      expect(listings[0]).toHaveProperty('title');
      expect(listings[0]).toHaveProperty('address');
    });

    test('should handle database errors', async () => {
      // Temporarily break the mock
      mockClient.db.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      await expect(listingService.getAllListings()).rejects.toThrow('Error fetching all listings');
    });
  });

  describe('getListingById', () => {
    test('should return listing by valid ID', async () => {
      const listingsCollection = db.collection('Listings');
      const mockListing = generateMockListing();
      await listingsCollection.insertOne(mockListing);

      const listing = await listingService.getListingById(mockListing._id.toString());
      
      expect(listing).toBeDefined();
      expect(listing.title).toBe(mockListing.title);
      expect(listing.address).toBe(mockListing.address);
    });

    test('should throw error for non-existent listing', async () => {
      const fakeId = new ObjectId();
      
      await expect(
        listingService.getListingById(fakeId.toString())
      ).rejects.toThrow('Listing not found');
    });

    test('should throw error for invalid ID format', async () => {
      await expect(
        listingService.getListingById('invalid-id')
      ).rejects.toThrow('Invalid id format');
    });

    test('should handle ObjectId instances', async () => {
      const listingsCollection = db.collection('Listings');
      const mockListing = generateMockListing();
      await listingsCollection.insertOne(mockListing);

      const listing = await listingService.getListingById(mockListing._id);
      
      expect(listing).toBeDefined();
      expect(listing._id.toString()).toBe(mockListing._id.toString());
    });
  });

  describe('deleteListing', () => {
    test('should delete existing listing', async () => {
      const listingsCollection = db.collection('Listings');
      const mockListing = generateMockListing();
      await listingsCollection.insertOne(mockListing);

      const result = await listingService.deleteListing(mockListing._id.toString());
      
      expect(result).toEqual({ message: 'Listing deleted' });

      // Verify deletion
      const deletedListing = await listingsCollection.findOne({ _id: mockListing._id });
      expect(deletedListing).toBeNull();
    });

    test('should throw error when deleting non-existent listing', async () => {
      const fakeId = new ObjectId();
      
      await expect(
        listingService.deleteListing(fakeId.toString())
      ).rejects.toThrow('Listing not found or already deleted');
    });

    test('should throw error for invalid ID format', async () => {
      await expect(
        listingService.deleteListing('invalid-id')
      ).rejects.toThrow('Invalid id format');
    });

    test('should not affect other listings', async () => {
      const listingsCollection = db.collection('Listings');
      const mockListings = [
        generateMockListing({ title: 'Listing 1' }),
        generateMockListing({ title: 'Listing 2' }),
      ];
      await listingsCollection.insertMany(mockListings);

      await listingService.deleteListing(mockListings[0]._id.toString());

      const remainingListings = await listingsCollection.find({}).toArray();
      expect(remainingListings).toHaveLength(1);
      expect(remainingListings[0].title).toBe('Listing 2');
    });
  });
});
