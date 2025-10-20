const { client } = require('../database/db');
const landlordDetails = require('./profileService')
const { ObjectId } = require('mongodb'); 

/**
 * @better
 * Converts a given id to a MongoDB ObjectId if possible.
 * Throws an error if the id is not a valid ObjectId string.
 * @param {string|ObjectId} id - The id to convert.
 * @returns {ObjectId}
 */
function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  throw new Error("Invalid id format: must be a valid ObjectId string");
}

/**
 * @better
 * Retrieves all property listings from the database.
 * @returns {Promise<Array>} - Array of all listings.
 */
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

/**
 * @better
 * Retrieves a single property listing by its unique id.
 * Throws an error if the listing is not found.
 * @param {string} id - The listing's unique id.
 * @returns {Promise<object>} - The listing object.
 */
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

/**
 * @better
 * Deletes a property listing by its unique id.
 * Throws an error if the listing does not exist or is already deleted.
 * @param {string} id - The listing's unique id.
 * @returns {Promise<object>} - Confirmation message.
 */
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
  getAllListings,
  getListingById,
  deleteListing
};