const { client } = require('../database/db');
const landlordDetails = require('./profileService')
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
async function createListing(id ,data) {
  try {
    const { title, address, description, amenities = [], imagesURL = [], price, isFavourited} = data;

    if (!title || !address || !description || !price) {
      throw new Error('Title, address, description, and price are required');
    }
  
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      throw new Error('Price must be a valid number');
    }

    //if you give a single amenity, convert to array
    if (typeof amenities === 'string') {
      data.amenities = [amenities];
    }

    //if amenities is not an array, throw error
    if (!Array.isArray(amenities)) {
      throw new Error('Amenities must be an array of strings');
    }

    

    // Ensure landlord ID is valid

    const db = client.db('RentWise');
    const listingsCollection = db.collection('Listings');

    const user = await landlordDetails.getProfileById(id); // Verify landlord exists

    const landlordInfo = {
      landlord: user._id,
      firstName: user.firstName,
      surname: user.surname,
      phone : user.phone,
      email : user.email,
    }
    

    const newListing = {
      title,
      address,
      description,
      amenities,
      imagesURL,
      parsedPrice,
      isFavourited: isFavourited || false,
      landlordInfo,
      createdAt: new Date()
    };

    const result = await listingsCollection.insertOne(newListing);
    return { message: 'Listing created', listingId: result.insertedId };
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