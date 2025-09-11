const { client } = require('../database/db');
const { ObjectId } = require('mongodb'); 
const listingDetails = require('./listingService')

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

async function favouriteListing(userID, listingID) {
  try{
    const db = client.db('RentWise');
    const favouritesCollection = db.collection('Favourites');
    const listingCollection = db.collection('Listings');

    // Check if listing exists
    const listing = await listingCollection.findOne({ _id: toObjectId(listingID) });
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Check if already favourited
    const existingFavourite = await favouritesCollection.findOne({ userId: toObjectId(userID), listingId: toObjectId(listingID) });
    if (existingFavourite) {
      return { message: "Listing already favourited" };
    }

    const listingInfo = await listingDetails.getListingById(listingID);

    new listingDetail = {
      listingID: listingInfo._id,
      title: listingInfo.title,
      address: listingInfo.address,
      description: listingInfo.description,
      amenities: listingInfo.amenities,
      images: listingInfo.imagesURL,
      price: listingInfo.parsedPrice,
      isFavourited: listingInfo.isFavourited = true,
      landlordInfo: listingInfo.landlordInfo,
      createdAt: listingInfo.createdAt = new Date()
    };

    // Add to favourites
    const result = await favouritesCollection.insertOne({
      userId: toObjectId(userID),
      listingDetail,
      favouritedAt: new Date()
    });

    return { message: "Listing favourited", favouriteId: result.insertedId };
  }
  catch (error) {
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
