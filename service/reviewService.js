const { client } = require('../database/db');
const { ObjectId } = require('mongodb');
const bookings = require('./bookingService');

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
async function createReview(userID, listingID, data) {
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
    const userCollection = db.collection('System-Users');

    // Check if listing exists
    const listing = await listingsCollection.findOne({ _id: toObjectId(listingID) });
    if (!listing) {
      throw new Error("Listing not found");
    }

    //check if user exists
    const user = await userCollection.findOne({_id: toObjectId(userID)});
    if(!user){
      throw new Error('User does not exist');
    }

    const booked = await bookings.getBookingById(userID);
    if(!booked) throw new Error('Can only leave a review is booking was made');
    
    const newReview = {
      listingId: toObjectId(listingID),
      userId: toObjectId(userID),
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
async function getAllReviews(listingID) {
  try {
    const db = client.db('RentWise');
    const reviewsCollection = db.collection('Reviews');
    
    const reviews = await reviewsCollection.find({listingId: toObjectId(listingID)}).toArray();

    if(!reviews){
      throw new Error('There are not reviews for the listing');
    }
    return reviews;
  } catch (error) {
    throw new Error(`Error fetching reviews: ${error.message}`);
  }
}

module.exports = {
  createReview,
  getAllReviews
};