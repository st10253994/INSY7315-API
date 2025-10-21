const { client } = require('../database/db');
const { ObjectId } = require('mongodb'); 
const listingDetails = require('./listingService');
const bookingService = require('./bookingService');

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
            address: listingInfo.address
        };

        // Only allow maintenance requests for accepted bookings
        const booking = await bookingCollection.findOne({ userId: toObjectId(userID), 'listingDetail.listingID': toObjectId(listingID), 'newBooking.status': 'Accepted' });

        if(!booking){
            throw new Error("There are no active bookings with the property to log the maintenance Request for");
        }

        const maintenanceID = await generateMaintenanceID();

        const newMaintenanceRequest = {
            maintenanceId: maintenanceID,
            issue,
            description,
            priority,
            documentsURL,
            createdAt: new Date()
        };

        const result = await maintenanceCollection.insertOne({
            userId: toObjectId(userID),
            listingDetail,
            bookingId: booking.bookingId,
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

async function generateMaintenanceID(){
  try {
    const db = client.db("RentWise");
    const maintenanceCollection = db.collection("Maintenance-Requests");

    // Find the maintenance request with the highest maintenanceId number
    const lastMaintenance = await maintenanceCollection
      .findOne(
        { maintenanceId: { $exists: true } },
        { sort: { maintenanceId: -1 } }
      );

    let nextNumber = 1;

    if (lastMaintenance && lastMaintenance.maintenanceId) {
      // Extract the number from the maintenance ID (e.g., "M-0001" -> 1)
      const lastNumber = parseInt(lastMaintenance.maintenanceId.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    // Format the number with leading zeros (4 digits)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    return `B-${formattedNumber}`;
  } catch (err) {
    throw new Error("Error generating booking ID: " + err.message);
  }
}

module.exports = {
    createMaintenanceRequest,
    getMaintenanceRequestForUserId,
    generateMaintenanceID
};