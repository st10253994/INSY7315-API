const { client } = require('../database/db');
const { ObjectId } = require('mongodb'); 

function toObjectId(id) {
  if (id instanceof ObjectId) return id; // already valid
  if (typeof id === "string") return new ObjectId(id); 
  throw new Error("Invalid id format");
}

// CREATE
async function createListing(data) {
  const { listingID, title, description, price } = data;
  
  if (!title || !description || !price) {
    throw new Error("Title, description, and price are required");
  }

  try {
    const db = client.db('RentWise');
    const listingsCollection = db.collection('Listings');

    const newListing = {
    title,
    description,
    price,
    createdAt: new Date()
    };

    

    const result = await listingsCollection.insertOne(newListing);
    return { message: "Listing created", listingId: result.insertedId };
  } catch (error) {
    throw new Error(`Error creating listing: ${error.message}`);
  }
}

// READ all
async function getAllListings() {
  try {
    const db = client.db('RentWise');
    const listingsCollection = db.collection('Listings');
    const listings = await listingsCollection.find({}).toArray();
    return listings;
  } catch (error) {
    throw new Error(`Error fetching listings: ${error.message}`);
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
    throw new Error(`Error fetching listing: ${error.message}`);
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

async function favouriteListing(id) {
  try {
    const db = client.db('RentWise');
    const listingCollection = db.collection('Listings');
    const favouritesCollection = db.collection('Favourites');

    const listing = await listingCollection.findOne({ _id: toObjectId(id) });
    if (!listing) throw new Error("Listing not found");

    const favouriteListing = {
      title: listing.title,
      description: listing.description,
      price: listing.price,
    };

    await favouritesCollection.updateOne(
      { listingId: toObjectId(id) },
      { $set: { favouriteListing, favouritedAt: new Date() } },
      { upsert: true }
    );
    return { message: "Listing favourited" };
  } catch (error) {
    throw new Error(`Error favouriting listing: ${error.message}`);
  }
}

async function getFavouritedListings() {
  const db = client.db('RentWise');
  const favouritesCollection = db.collection('Favourites');

  const favourites = await favouritesCollection.find({}).toArray();
  return favourites;
}

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  deleteListing,
  favouriteListing,
  getFavouritedListings
};