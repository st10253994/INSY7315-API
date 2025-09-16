const { client } = require('../database/db');
const { ObjectId } = require('mongodb'); 
const listingDetails = require('./listingService');
const bookingService = require('./bookingService');

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

//create with listing ID
async function createMaintenanceRequest(userID, listingID, data) {
    try{
        const db = client.db('RentWise');
        const maintenanceCollection = db.collection('Maintenance-Requests');
        const listingCollection = db.collection('Listings')
        const bookingCollection = db.collection('Bookings');

        const {issue, description, priority, documentsURL = []} = data;

        if(!issue || !description || !priority){
            throw new Error ('All data fields have to be filled in');
        }

        // Check if listing exists
        const listing = await listingCollection.findOne({ _id: toObjectId(listingID) });
        if (!listing) {
        throw new Error("Listing not found");
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
              landlordInfo: listingInfo.landlordInfo
            };

            const booking = await bookingCollection.findOne({ userId: toObjectId(userID) });

            if(!booking){
                throw new Error("There are no bookings to log the maintenance Request for");
            }

            const newMaintenanceRequest = {
                issue,
                description,
                priority,
                documentsURL,
                createdAt: new Date()
            };

        const result = await maintenanceCollection.insertOne({
            userId: toObjectId(userID),
            listingDetail,
            bookingId: toObjectId(booking._id),
            newMaintenanceRequest
        });
        return { message: "New Maintenance Request has been submitted", maintenanceID: result.insertedId };
    }catch(error){
        throw new Error("Error creating Maintenance Request " + error.message);
    }
}

module.exports = {
    createMaintenanceRequest
};