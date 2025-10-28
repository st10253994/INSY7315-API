/**
 * Unit Tests for Favourite Service
 */

const favouriteService = require('../../service/favouriteService');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testDbSetup');
const { generateMockUser, generateMockListing } = require('../helpers');
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

describe('Favourite Service', () => {
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

  describe('favouriteListing', () => {
    let mockUser;
    let mockListing;

    beforeEach(async () => {
      mockUser = generateMockUser();
      mockListing = generateMockListing();
      
      await db.collection('System-Users').insertOne(mockUser);
      await db.collection('Listings').insertOne(mockListing);
    });

    test('should favourite a listing successfully', async () => {
      const result = await favouriteService.favouriteListing(
        mockUser._id.toString(),
        mockListing._id.toString()
      );

      expect(result).toHaveProperty('message', 'Listing favourited');
      expect(result).toHaveProperty('favouriteId');

      // Verify favourite in database
      const favourite = await db.collection('Favourites').findOne({ _id: result.favouriteId });
      expect(favourite).toBeDefined();
      expect(favourite.userId.toString()).toBe(mockUser._id.toString());
      expect(favourite.listingDetail.listingID.toString()).toBe(mockListing._id.toString());
      expect(favourite.listingDetail.isFavourited).toBe(true);
    });

    test('should throw error for non-existent listing', async () => {
      const fakeListingId = new ObjectId();

      await expect(
        favouriteService.favouriteListing(mockUser._id.toString(), fakeListingId.toString())
      ).rejects.toThrow('Listing not found');
    });

    test('should throw error when favouriting already favourited listing', async () => {
      // Add favourite first time
      await favouriteService.favouriteListing(
        mockUser._id.toString(),
        mockListing._id.toString()
      );

      // Try to favourite again
      await expect(
        favouriteService.favouriteListing(mockUser._id.toString(), mockListing._id.toString())
      ).rejects.toThrow('Favourite already exists');
    });

    test('should store complete listing details', async () => {
      const result = await favouriteService.favouriteListing(
        mockUser._id.toString(),
        mockListing._id.toString()
      );

      const favourite = await db.collection('Favourites').findOne({ _id: result.favouriteId });
      
      expect(favourite.listingDetail).toHaveProperty('title', mockListing.title);
      expect(favourite.listingDetail).toHaveProperty('address', mockListing.address);
      expect(favourite.listingDetail).toHaveProperty('description', mockListing.description);
      expect(favourite.listingDetail).toHaveProperty('price', mockListing.price);
      expect(favourite.listingDetail).toHaveProperty('amenities');
      expect(favourite.listingDetail).toHaveProperty('images');
    });
  });

  describe('getFavouriteListings', () => {
    let mockUser;

    beforeEach(async () => {
      mockUser = generateMockUser();
      await db.collection('System-Users').insertOne(mockUser);
    });

    test('should return empty array when user has no favourites', async () => {
      const favourites = await favouriteService.getFavouriteListings(mockUser._id.toString());
      expect(favourites).toEqual([]);
    });

    test('should return all favourites for a user', async () => {
      const mockListings = [
        generateMockListing({ title: 'Listing 1' }),
        generateMockListing({ title: 'Listing 2' }),
        generateMockListing({ title: 'Listing 3' }),
      ];
      
      await db.collection('Listings').insertMany(mockListings);

      // Favourite all listings
      for (const listing of mockListings) {
        await favouriteService.favouriteListing(mockUser._id.toString(), listing._id.toString());
      }

      const favourites = await favouriteService.getFavouriteListings(mockUser._id.toString());
      
      expect(favourites).toHaveLength(3);
      expect(favourites[0]).toHaveProperty('listingDetail');
      expect(favourites[0]).toHaveProperty('favouritedAt');
    });

    test('should only return favourites for specified user', async () => {
      const anotherUser = generateMockUser({ email: 'another@example.com' });
      await db.collection('System-Users').insertOne(anotherUser);

      const mockListing = generateMockListing();
      await db.collection('Listings').insertOne(mockListing);

      await favouriteService.favouriteListing(mockUser._id.toString(), mockListing._id.toString());
      
      const favourites = await favouriteService.getFavouriteListings(anotherUser._id.toString());
      expect(favourites).toEqual([]);
    });
  });

  describe('unfavouriteListing', () => {
    let mockUser;
    let mockListing;

    beforeEach(async () => {
      mockUser = generateMockUser();
      mockListing = generateMockListing();
      
      await db.collection('System-Users').insertOne(mockUser);
      await db.collection('Listings').insertOne(mockListing);
    });

    test('should unfavourite a listing successfully', async () => {
      // Add favourite first
      await favouriteService.favouriteListing(mockUser._id.toString(), mockListing._id.toString());

      const result = await favouriteService.unfavouriteListing(
        mockUser._id.toString(),
        mockListing._id.toString()
      );

      expect(result).toEqual({ message: 'Listing unfavourited' });

      // Verify deletion
      const favourite = await db.collection('Favourites').findOne({
        userId: mockUser._id,
        'listingDetail.listingID': mockListing._id,
      });
      expect(favourite).toBeNull();
    });

    test('should throw error when unfavouriting non-existent favourite', async () => {
      await expect(
        favouriteService.unfavouriteListing(mockUser._id.toString(), mockListing._id.toString())
      ).rejects.toThrow('there are not current favourites to delete');
    });

    test('should not affect other user favourites', async () => {
      const anotherUser = generateMockUser({ email: 'another@example.com' });
      await db.collection('System-Users').insertOne(anotherUser);

      await favouriteService.favouriteListing(mockUser._id.toString(), mockListing._id.toString());
      await favouriteService.favouriteListing(anotherUser._id.toString(), mockListing._id.toString());

      await favouriteService.unfavouriteListing(mockUser._id.toString(), mockListing._id.toString());

      const otherUserFavourites = await favouriteService.getFavouriteListings(anotherUser._id.toString());
      expect(otherUserFavourites).toHaveLength(1);
    });
  });

  describe('getFavouriteByListingId', () => {
    let mockUser;
    let mockListing;

    beforeEach(async () => {
      mockUser = generateMockUser();
      mockListing = generateMockListing();
      
      await db.collection('System-Users').insertOne(mockUser);
      await db.collection('Listings').insertOne(mockListing);
    });

    test('should return favourite by listing ID', async () => {
      await favouriteService.favouriteListing(mockUser._id.toString(), mockListing._id.toString());

      const favourite = await favouriteService.getFavouriteByListingId(mockListing._id.toString());
      
      expect(favourite).toBeDefined();
      expect(favourite.listingDetail.listingID.toString()).toBe(mockListing._id.toString());
    });

    test('should return null when listing is not favourited', async () => {
      const favourite = await favouriteService.getFavouriteByListingId(mockListing._id.toString());
      expect(favourite).toBeNull();
    });

    test('should handle invalid listing ID', async () => {
      await expect(
        favouriteService.getFavouriteByListingId('invalid-id')
      ).rejects.toThrow();
    });
  });
});
