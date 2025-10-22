const { client } = require('../database/db');
const { ObjectId } = require('mongodb'); 
const listingDetails = require('./listingService');
const bookingService = require('./bookingService');
const { generateMaintenanceID } = require('../util/IdGeneration/idGeneration');

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
 * Creates a new maintenance request for a user and listing.
 * Validates required fields, checks for an active booking, and embeds listing details.
 * @param {string} userID - The user's id.
 * @param {string} listingID - The listing's id.
 * @param {object} data - Maintenance request details (issue, description, priority, documents).
 * @returns {Promise<object>} Confirmation message and maintenance request id.
 * @throws {Error} If validation fails or dependencies are missing.
 */
async function createMaintenanceRequest(userID, listingID, data) {
    console.log(`[createMaintenanceRequest] Entry: userID="${userID}", listingID="${listingID}"`);
    console.log(`[createMaintenanceRequest] Data received:`, data);
    try{
        const db = client.db('RentWise');
        const maintenanceCollection = db.collection('Maintenance-Requests');
        const listingCollection = db.collection('Listings')
        const bookingCollection = db.collection('Bookings');

        const {issue, description, priority, documentURL = []} = data;

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
            landlordID: userID,
            address: listingInfo.address
        };

        // Only allow maintenance requests for accepted bookings
        const booking = await bookingCollection.findOne({ userId: toObjectId(userID), 'listingDetail.listingID': toObjectId(listingID), 'newBooking.status': 'Active' });

        if(!booking){
            throw new Error("There are no active bookings with the property to log the maintenance Request for");
        }

        const maintenanceID = await generateMaintenanceID();

        const newMaintenanceRequest = {
            maintenanceId: maintenanceID,
            issue,
            description,
            priority,
            documentURL,
            createdAt: new Date()
        };

        const result = await maintenanceCollection.insertOne({
            userId: toObjectId(userID),
            listingDetail,
            bookingId: booking.newBooking.bookingId,
            newMaintenanceRequest
        });
        console.log(`[createMaintenanceRequest] Exit: Maintenance request created with id="${result.insertedId}"`);
        return { message: "New Maintenance Request has been submitted", maintenanceID: result.insertedId };
    }catch(error){
        console.error(`[createMaintenanceRequest] Error: ${error.message}`);
        throw new Error("Error creating Maintenance Request " + error.message);
    }
}

/**
 * Retrieves all maintenance requests for a specific user.
 * @param {string} userID - The user's id.
 * @param {string} listingID - (Optional) The listing's id.
 * @returns {Promise<Array>} Array of maintenance request documents.
 * @throws {Error} If retrieval fails.
 */
async function getMaintenanceRequestForUserId(userID, listingID) {
    console.log(`[getMaintenanceRequestForUserId] Entry: userID="${userID}"`);
    try {
        const db = client.db('RentWise');
        const maintenanceCollection = db.collection('Maintenance-Requests');
        const requests = await maintenanceCollection.find({ userId: toObjectId(userID) }).toArray();
        console.log(`[getMaintenanceRequestForUserId] Exit: Found ${requests.length} requests`);
        return requests;
    } catch (error) {
        console.error(`[getMaintenanceRequestForUserId] Error: ${error.message}`);
        throw new Error("Error fetching Maintenance Requests: " + error.message);
    }
}


module.exports = {
    createMaintenanceRequest,
    getMaintenanceRequestForUserId,
    generateMaintenanceID
};