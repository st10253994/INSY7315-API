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

    // Check if already favourited - use consistent field name
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
      isFavourited: true, // Fixed assignment
      landlordInfo: listingInfo.landlordInfo,
      createdAt: new Date() // Fixed assignment
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

async function getFavouriteListings(userID) {
  try {
    const db = client.db('RentWise');
    const favouriteCollection = db.collection('Favourites');

    const favourites = await favouriteCollection.find({
      userId: toObjectId(userID)
    }).toArray(); 

    if (favourites.length === 0) {
      return []; 
    }
    
    return favourites;
  } catch (error) {
    throw new Error(`Error pulling favourite listings: ${error.message}`);
  }
}

async function unfavouriteListing(userID, listingID) {
  try {
    const db = client.db('RentWise');
    const favouritesCollection = db.collection('Favourites');
    
    const result = await favouritesCollection.deleteOne({userId: toObjectId(userID), "listingDetail.listingID": toObjectId(listingID)});

    //check if the deletecount is null
    if(result.deletedCount === 0){
      throw new Error("there are not current favourites to delete");
    }else{
      return { message: "Listing unfavourited" };
    }
  } catch (error) {
    throw new Error(`Error unfavouriting listing: ${error.message}`);
  }
}

async function getFavouriteByListingId(listingID) {
  try {
    const db = client.db('RentWise');
    const favouritesCollection = db.collection('Favourites');
    const favourite = await favouritesCollection.findOne({ "listingDetail.listingID": toObjectId(listingID) }).toArray();
    return favourite;
  } catch (error) {
    throw new Error(`Error retrieving favourite by listing ID: ${error.message}`);
  } 
}

module.exports = {
  favouriteListing,
  getFavouriteListings,
  unfavouriteListing,
  getFavouriteByListingId
};
