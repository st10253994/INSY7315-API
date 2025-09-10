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

//create with listing ID
async function createMaintenanceRequest(listingId, data) {
    try{
        const db = client.db('RentWise');
        const maintenanceCollection = db.collection('MaintenanceRequests');

        const { issueTitle, issueDescription, location, priority = [], documentURL = [] } = data;

        if (!issueTitle || !issueDescription || !location) {
        throw new Error('Issue description and preferred date are required');
        }
        //if you give a single image, convert to array
        if (typeof documentURL === 'string') {
        data.documentURL = [documentURL];
        }
        //if imagesURL is not an array, throw error
        if (!Array.isArray(documentURL)) {
        throw new Error('imagesURL must be an array of strings');
        }
        // Ensure listing ID is valid
        const listingObjectId = toObjectId(listingId);
        const listing = await db.collection('Listings').findOne({ _id: listingObjectId });
        if (!listing) {
        throw new Error('Listing not found');
        }

        const newRequest = {
            listing: ObjectId(listingId),
            issueTitle,
            issueDescription,
            location,
            priority,
            documentURL,
            status: 'Pending',
        };
        const result = await maintenanceCollection.insertOne(newRequest);
        return { message: 'Maintenance Request submitted', maintenanceID: result.insertedId };
    } catch (error) {
        throw new Error('Error creating maintenance request: ' + error.message);
    }
}

module.exports = {
    createMaintenanceRequest
};