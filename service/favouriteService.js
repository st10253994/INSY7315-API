const { client } = require('../database/db');
const { ObjectId } = require('mongodb'); 
const listingDetails = require('./listingService');

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
 * Adds a listing to a user's favourites.
 * Prevents duplicates and embeds listing details.
 * @param {string} userID - The user's id.
 * @param {string} listingID - The listing's id.
 * @returns {Promise<object>} Confirmation message and favourite id.
 */
async function favouriteListing(userID, listingID) {
  console.log(`[favouriteListing] Entry: userID="${userID}", listingID="${listingID}"`);
  try {
    const db = client.db('RentWise');
    const favouritesCollection = db.collection('Favourites');
    const listingCollection = db.collection('Listings');

    const listing = await listingCollection.findOne({ _id: toObjectId(listingID) });
    if (!listing) {
      throw new Error("Listing not found");
    }

    const existingFavourite = await favouritesCollection.findOne({ 
      userId: toObjectId(userID), 
      "listingDetail.listingID": toObjectId(listingID) 
    });
    if (existingFavourite) {
      throw new Error("Favourite already exists");
    }

    const listingInfo = await listingDetails.getListingById(listingID);

    const listingDetail = {
      listingID: listingInfo._id,
      title: listingInfo.title,
      address: listingInfo.address,
      description: listingInfo.description,
      amenities: listingInfo.amenities,
      images: listingInfo.imagesURL,
      price: listingInfo.parsedPrice,
      isFavourited: true,
      landlordInfo: listingInfo.landlordInfo,
      createdAt: new Date()
    };

    const result = await favouritesCollection.insertOne({
      userId: toObjectId(userID),
      listingDetail,
      favouritedAt: new Date()
    });

    console.log(`[favouriteListing] Exit: Listing favourited with id="${result.insertedId}"`);
    return { message: "Listing favourited", favouriteId: result.insertedId };
  } catch (error) {
    console.error(`[favouriteListing] Error: ${error.message}`);
    throw new Error(`Error favouriting listing: ${error.message}`);
  }
}

/**
 * Retrieves all favourite listings for a user.
 * @param {string} userID - The user's id.
 * @returns {Promise<Array>} Array of favourite documents.
 */
async function getFavouriteListings(userID) {
  console.log(`[getFavouriteListings] Entry: userID="${userID}"`);
  try {
    const db = client.db('RentWise');
    const favouriteCollection = db.collection('Favourites');

    const favourites = await favouriteCollection.find({
      userId: toObjectId(userID)
    }).toArray(); 

    if (favourites.length === 0) {
      console.log(`[getFavouriteListings] Exit: No favourites found`);
      return []; 
    }
    console.log(`[getFavouriteListings] Exit: Found ${favourites.length} favourites`);
    return favourites;
  } catch (error) {
    console.error(`[getFavouriteListings] Error: ${error.message}`);
    throw new Error(`Error pulling favourite listings: ${error.message}`);
  }
}

/**
 * Removes a listing from a user's favourites.
 * @param {string} userID - The user's id.
 * @param {string} listingID - The listing's id.
 * @returns {Promise<object>} Confirmation message.
 * @throws {Error} If no favourite is found to delete.
 */
async function unfavouriteListing(userID, listingID) {
  console.log(`[unfavouriteListing] Entry: userID="${userID}", listingID="${listingID}"`);
  try {
    const db = client.db('RentWise');
    const favouritesCollection = db.collection('Favourites');
    
    const result = await favouritesCollection.deleteOne({
      userId: toObjectId(userID), 
      "listingDetail.listingID": toObjectId(listingID)
    });

    if (result.deletedCount === 0) {
      console.log(`[unfavouriteListing] Exit: No favourites to delete`);
      throw new Error("there are not current favourites to delete");
    } else {
      console.log(`[unfavouriteListing] Exit: Listing unfavourited`);
      return { message: "Listing unfavourited" };
    }
  } catch (error) {
    console.error(`[unfavouriteListing] Error: ${error.message}`);
    throw new Error(`Error unfavouriting listing: ${error.message}`);
  }
}

/**
 * Retrieves a favourite record by listing ID.
 * @param {string} listingID - The listing's id.
 * @returns {Promise<object|null>} The favourite document or null if not found.
 */
async function getFavouriteByListingId(listingID) {
  console.log(`[getFavouriteByListingId] Entry: listingID="${listingID}"`);
  try {
    const db = client.db('RentWise');
    const favouritesCollection = db.collection('Favourites');
    const favourite = await favouritesCollection.findOne({ "listingDetail.listingID": toObjectId(listingID) });
    if (favourite) {
      console.log(`[getFavouriteByListingId] Exit: Favourite found`);
    } else {
      console.log(`[getFavouriteByListingId] Exit: No favourite found`);
    }
    return favourite;
  } catch (error) {
    console.error(`[getFavouriteByListingId] Error: ${error.message}`);
    throw new Error(`Error retrieving favourite by listing ID: ${error.message}`);
  } 
}

module.exports = {
  favouriteListing,
  getFavouriteListings,
  unfavouriteListing,
  getFavouriteByListingId
};
