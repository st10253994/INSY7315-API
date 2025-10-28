/**
 * Unit Tests for Review Service
 */

const reviewService = require('../../service/reviewService');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testDbSetup');
const { generateMockUser, generateMockListing, generateMockBooking, generateMockReview } = require('../helpers');
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

describe('Review Service', () => {
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

  describe('createReview', () => {
    let mockUser;
    let mockListing;
    let mockBooking;

    beforeEach(async () => {
      mockUser = generateMockUser();
      mockListing = generateMockListing();
      mockBooking = generateMockBooking(mockUser._id, mockListing._id);
      
      await db.collection('System-Users').insertOne(mockUser);
      await db.collection('Listings').insertOne(mockListing);
      await db.collection('Bookings').insertOne(mockBooking);
    });

    test('should create a review successfully', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Great place to stay!',
      };

      const result = await reviewService.createReview(
        mockUser._id.toString(),
        mockListing._id.toString(),
        reviewData
      );

      expect(result).toHaveProperty('message', 'Review created');
      expect(result).toHaveProperty('reviewId');

      // Verify review in database
      const review = await db.collection('Reviews').findOne({ _id: result.reviewId });
      expect(review).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Great place to stay!');
      expect(review.userId.toString()).toBe(mockUser._id.toString());
      expect(review.listingId.toString()).toBe(mockListing._id.toString());
    });

    test('should throw error when rating is missing', async () => {
      const reviewData = {
        comment: 'Great place!',
      };

      await expect(
        reviewService.createReview(mockUser._id.toString(), mockListing._id.toString(), reviewData)
      ).rejects.toThrow('listingID and rating are required');
    });

    test('should throw error for rating below 1', async () => {
      const reviewData = {
        rating: 0,
        comment: 'Bad place',
      };

      await expect(
        reviewService.createReview(mockUser._id.toString(), mockListing._id.toString(), reviewData)
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    test('should throw error for rating above 5', async () => {
      const reviewData = {
        rating: 6,
        comment: 'Amazing place',
      };

      await expect(
        reviewService.createReview(mockUser._id.toString(), mockListing._id.toString(), reviewData)
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    test('should throw error for non-existent listing', async () => {
      const fakeListingId = new ObjectId();
      const reviewData = {
        rating: 5,
        comment: 'Great place!',
      };

      await expect(
        reviewService.createReview(mockUser._id.toString(), fakeListingId.toString(), reviewData)
      ).rejects.toThrow('Listing not found');
    });

    test('should throw error for non-existent user', async () => {
      const fakeUserId = new ObjectId();
      const reviewData = {
        rating: 5,
        comment: 'Great place!',
      };

      await expect(
        reviewService.createReview(fakeUserId.toString(), mockListing._id.toString(), reviewData)
      ).rejects.toThrow('User does not exist');
    });

    test('should throw error if user has not booked the listing', async () => {
      const anotherUser = generateMockUser({ email: 'another@example.com' });
      await db.collection('System-Users').insertOne(anotherUser);

      const reviewData = {
        rating: 5,
        comment: 'Great place!',
      };

      await expect(
        reviewService.createReview(anotherUser._id.toString(), mockListing._id.toString(), reviewData)
      ).rejects.toThrow('Can only leave a review if booking was made');
    });

    test('should allow review without comment', async () => {
      const reviewData = {
        rating: 4,
      };

      const result = await reviewService.createReview(
        mockUser._id.toString(),
        mockListing._id.toString(),
        reviewData
      );

      const review = await db.collection('Reviews').findOne({ _id: result.reviewId });
      expect(review.comment).toBe('');
    });
  });

  describe('getAllReviews', () => {
    let mockListing;

    beforeEach(async () => {
      mockListing = generateMockListing();
      await db.collection('Listings').insertOne(mockListing);
    });

    test('should return all reviews for a listing', async () => {
      const mockReviews = [
        generateMockReview(new ObjectId(), mockListing._id, { rating: 5 }),
        generateMockReview(new ObjectId(), mockListing._id, { rating: 4 }),
        generateMockReview(new ObjectId(), mockListing._id, { rating: 3 }),
      ];
      
      await db.collection('Reviews').insertMany(mockReviews);

      const reviews = await reviewService.getAllReviews(mockListing._id.toString());
      
      expect(reviews).toHaveLength(3);
      expect(reviews[0]).toHaveProperty('rating');
      expect(reviews[0]).toHaveProperty('comment');
    });

    test('should return empty array when no reviews exist', async () => {
      const reviews = await reviewService.getAllReviews(mockListing._id.toString());
      expect(reviews).toEqual([]);
    });

    test('should only return reviews for specified listing', async () => {
      const anotherListing = generateMockListing({ title: 'Another Listing' });
      await db.collection('Listings').insertOne(anotherListing);

      const reviewsForListing1 = [
        generateMockReview(new ObjectId(), mockListing._id),
        generateMockReview(new ObjectId(), mockListing._id),
      ];
      const reviewsForListing2 = [
        generateMockReview(new ObjectId(), anotherListing._id),
      ];
      
      await db.collection('Reviews').insertMany([...reviewsForListing1, ...reviewsForListing2]);

      const reviews = await reviewService.getAllReviews(mockListing._id.toString());
      
      expect(reviews).toHaveLength(2);
      reviews.forEach(review => {
        expect(review.listingId.toString()).toBe(mockListing._id.toString());
      });
    });

    test('should handle invalid listing ID', async () => {
      await expect(
        reviewService.getAllReviews('invalid-id')
      ).rejects.toThrow();
    });
  });
});
