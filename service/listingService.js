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
async function createListing(data) {
  const { title, description, price, images = [] } = data;

  if (!title || !description || !price) {
    throw new Error('Title, description, and price are required');
  }

  const db = client.db('RentWise');
  const listingsCollection = db.collection('Listings');

  const newListing = {
    title,
    description,
    price,
    images, // store Cloudinary URLs
    createdAt: new Date(),
  };

  const result = await listingsCollection.insertOne(newListing);
  return { message: 'Listing created', listingId: result.insertedId };
}

// READ all
async function getAllListings() {
  try {
    const db = client.db('RentWise');
    const listingsCollection = db.collection('Listings');
    const listings = await listingsCollection.find({}).toArray();
    return listings;
  } catch (error) {
    throw new Error(`Error fetching all listings: ${error.message}`);
  }
}

// READ one
async function getListingById(id) {
  try {
    const db = client.db('RentWise');
    const listingsCollection = db.collection('Listings');
    const listing = await listingsCollection.findOne({ _id: toObjectId(id) });
    if (!listing) {
    throw new Error("Listing not found");
    }
    return listing;
  } catch (error) {
    throw new Error(`Error fetching listings by ID: ${error.message}`);
  }
}


// DELETE
async function deleteListing(id) {
  
  try {
    const db = client.db('RentWise');
    const listingsCollection = db.collection('Listings');
    const result = await listingsCollection.deleteOne({ _id: toObjectId(id) });
    if (result.deletedCount === 0) {
    throw new Error("Listing not found or already deleted");
    }
    return { message: "Listing deleted" };
  } catch (error) {
    throw new Error(`Error deleting listing: ${error.message}`);
  }
}


module.exports = {
  createListing,
  getAllListings,
  getListingById,
  deleteListing
};