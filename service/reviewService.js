const { client } = require('../database/db');
const { ObjectId } = require('mongodb');

function toObjectId(id) {
  // If already an ObjectId, return it
  if (id instanceof ObjectId) return id;

  // If it's a string and is valid, convert
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }

  // Otherwise, throw error
  throw new Error("Invalid id format: must be a valid ObjectId string");
}

// CREATE
async function createReview(id, data) {
  const {rating, comment } = data;
  if (!rating) {
    throw new Error("listingID and rating are required");
  }
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  try {
    const db = client.db('RentWise');
    const reviewsCollection = db.collection('Reviews');
    const listingsCollection = db.collection('Listings');

    // Check if listing exists
    const listing = await listingsCollection.findOne({ _id: toObjectId(id) });
    if (!listing) {
      throw new Error("Listing not found");
    }
    const newReview = {
      listingID: toObjectId(id),
      rating,
      comment: comment || "",
      createdAt: new Date()
    };
    const result = await reviewsCollection.insertOne(newReview);
    return { message: "Review created", reviewId: result.insertedId };
  } catch (error) {
    throw new Error(`Error creating review: ${error.message}`);
  }
}

// GET all
async function getAllReviews() {
  try {
    const db = client.db('RentWise');
    const reviewsCollection = db.collection('Reviews');
    const reviews = await reviewsCollection.find({}).toArray();
    return reviews;
  } catch (error) {
    throw new Error(`Error fetching reviews: ${error.message}`);
  }
}

module.exports = {
  createReview,
  getAllReviews
};