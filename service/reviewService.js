const { client } = require('../database/db');
const { ObjectId } = require('mongodb');
const bookings = require('./bookingService');

/**
 * Converts a value to a MongoDB ObjectId if valid.
 * @param {string|ObjectId} id - The id to convert.
 * @returns {ObjectId}
 * @throws {Error} If the id is not a valid ObjectId.
 */
function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  throw new Error("Invalid id format: must be a valid ObjectId string");
}

/**
 * Creates a new review for a listing by a user.
 * Checks for valid rating, user existence, and booking before allowing review.
 * @param {string} userID - The user's id.
 * @param {string} listingID - The listing's id.
 * @param {object} data - Review details (rating, comment).
 * @returns {Promise<object>} Confirmation message and review id.
 * @throws {Error} If validation fails or dependencies are missing.
 */
async function createReview(userID, listingID, data) {
  console.log(`[createReview] Entry: userID="${userID}", listingID="${listingID}"`);
  const { rating, comment } = data;
  if (rating === undefined || rating === null) {
    throw new Error("listingID and rating are required");
  }
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  try {
    const db = client.db('RentWise');
    const reviewsCollection = db.collection('Reviews');
    const listingsCollection = db.collection('Listings');
    const userCollection = db.collection('System-Users');
    const bookingCollection = db.collection('Bookings');

    // Check if listing exists
    const listing = await listingsCollection.findOne({ _id: toObjectId(listingID) });
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Check if user exists
    const user = await userCollection.findOne({ _id: toObjectId(userID) });
    if (!user) {
      throw new Error('User does not exist');
    }

    // Ensure user has booked the listing before reviewing
    const booked = await bookingCollection.findOne({ userId: toObjectId(userID), 'listingDetail.listingID': toObjectId(listingID) });
    if (!booked) {
      throw new Error('Can only leave a review if booking was made');
    }

    const newReview = {
      listingId: toObjectId(listingID),
      userId: toObjectId(userID),
      rating,
      comment: comment || "",
      createdAt: new Date()
    };
    const result = await reviewsCollection.insertOne(newReview);
    console.log(`[createReview] Exit: Review created with id="${result.insertedId}"`);
    return { message: "Review created", reviewId: result.insertedId };
  } catch (error) {
    console.error(`[createReview] Error: ${error.message}`);
    throw new Error(`Error creating review: ${error.message}`);
  }
}

/**
 * Retrieves all reviews for a specific listing.
 * @param {string} listingID - The listing's id.
 * @returns {Promise<Array>} Array of review documents.
 * @throws {Error} If no reviews are found or retrieval fails.
 */
async function getAllReviews(listingID) {
  console.log(`[getAllReviews] Entry: listingID="${listingID}"`);
  try {
    const db = client.db('RentWise');
    const reviewsCollection = db.collection('Reviews');
    const reviews = await reviewsCollection.find({ listingId: toObjectId(listingID) }).toArray();

    if (!reviews) {
      throw new Error('There are not reviews for the listing');
    }
    console.log(`[getAllReviews] Exit: Found ${reviews.length} reviews`);
    return reviews;
  } catch (error) {
    console.error(`[getAllReviews] Error: ${error.message}`);
    throw new Error(`Error fetching reviews: ${error.message}`);
  }
}

module.exports = {
  createReview,
  getAllReviews
};