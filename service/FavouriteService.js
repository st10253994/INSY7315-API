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
      images: listing.images
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

async function favouriteListings() {
  try {
    const db = client.db('RentWise');
    const favouritesCollection = db.collection('Favourites');
    const listings = await favouritesCollection.find({}).toArray();
    return listings;
  } catch (error) {
    throw new Error(`Error fetching favourited listings: ${error.message}`);
  }
}

async function unfavouriteListing(id) {
  try {
    const db = client.db('RentWise');
    const favouritesCollection = db.collection('Favourites');
    const result = await favouritesCollection.deleteOne({ listingId: toObjectId(id) });
    if (result.deletedCount === 0) {
      throw new Error("Listing not found in favourites");
    }
    return { message: "Listing unfavourited" };
  } catch (error) {
    throw new Error(`Error unfavouriting listing: ${error.message}`);
  }
}

module.exports = {
  favouriteListing,
  favouriteListings,
  unfavouriteListing
};