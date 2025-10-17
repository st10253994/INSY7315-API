// service/bookingService.js
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
 * Creates a new booking for a user and listing.
 * Validates required fields and embeds listing details in the booking.
 * @param {string} userID - The user's id.
 * @param {string} listingID - The listing's id.
 * @param {object} data - Booking details (dates, guests, documents, price).
 * @returns {Promise<object>} Confirmation message and booking id.
 */
async function createBooking(userID, listingID, data) {
  console.log(`[createBooking] Entry: userID="${userID}", listingID="${listingID}"`);
  try{
    const db = client.db('RentWise');
    const bookingsCollection = db.collection('Bookings');

    const { checkInDate, checkOutDate, numberOfGuests, supportDocuments = [], totalPrice } = data;

    const parsedPrice = parseFloat(totalPrice);
    if (isNaN(parsedPrice)) {
      throw new Error('Total Price must be a valid number');
    }
    if (!checkInDate || !checkOutDate || !numberOfGuests) {
      throw new Error('Check-in date, check-out date, and number of guests are required');
    }
    if (typeof supportDocuments === 'string') {
      data.supportDocuments = [supportDocuments];
    }
    if (!Array.isArray(supportDocuments)) {
      throw new Error('supportDocuments must be an array of strings');
    }

    const listingObjectId = toObjectId(listingID);
    const listing = await db.collection('Listings').findOne({ _id: listingObjectId });
    if (!listing) {
      throw new Error('Listing not found');
    }

    const existingBooking = await bookingsCollection.findOne({ userId: toObjectId(userID)})
    if(existingBooking) {
      throw new Error('User already has an active or pending booking. Wait until the dates pass to make a new one');
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

        const bookingID = await generateBookingID();

    const newBooking = {
      bookingId: bookingID,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      supportDocuments,
      totalPrice: parsedPrice,
      status: 'Pending',
      createdAt: new Date()
    };

    const result = await bookingsCollection.insertOne({
      userId: toObjectId(userID),
      listingDetail,
      newBooking
    });
    console.log(`[createBooking] Exit: Booking created with id="${result.insertedId}"`);
    return { message: 'Booking created', bookingID: result.insertedId };
  }
  catch (error) {
    console.error(`[createBooking] Error: ${error.message}`);
    throw new Error('Error creating booking: ' + error.message);
  }
}

/**
 * Retrieves all bookings from the database.
 * @returns {Promise<Array>} Array of booking documents.
 */
async function getAllBookings() {
  console.log(`[getAllBookings] Entry`);
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');
  const docs = await bookings.find({}).toArray();
  console.log(`[getAllBookings] Exit: Found ${docs.length} bookings`);
  return docs;
}

/**
 * Retrieves a booking by user id.
 * @param {string} id - The user's id.
 * @returns {Promise<object>} The booking document.
 * @throws {Error} If no booking is found.
 */
async function getBookingById(id) {
  console.log(`[getBookingById] Entry: userId="${id}"`);
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  const booking = await bookings.findOne({ userId: toObjectId(id), 'newBooking.status': { $nin: ['Active', 'Completed', 'Cancelled'] }});
  if (!booking) throw new Error('No Booking Was Found');
  
  return booking;
}

/**
 * Updates a booking by its id with provided fields.
 * @param {string} id - The booking's id.
 * @param {object} data - Fields to update.
 * @returns {Promise<object>} Confirmation message.
 * @throws {Error} If no valid fields or booking not found.
 */
async function updateBooking(id, data) {
  console.log(`[updateBooking] Entry: bookingId="${id}"`);
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  const updateData = {};
  if (data.guestAmount !== undefined) updateData.guestAmount = data.guestAmount;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.status !== undefined) updateData.status = data.status;
  if (Object.keys(updateData).length === 0) throw new Error('No valid fields to update');

  const result = await bookings.updateOne(
    { _id: toObjectId(id) },
    { $set: updateData }
  );
  if (result.matchedCount === 0) {
    console.error(`[updateBooking] Error: Booking not found`);
    throw new Error('Booking not found');
  }
  if (result.modifiedCount === 0) {
    console.warn(`[updateBooking] Warning: No changes were made to the booking`);
    throw new Error('No changes were made to the booking');
  }

  console.log(`[updateBooking] Exit: Booking updated for bookingId="${id}"`);
  return { message: 'Booking updated' };
}

/**
 * Deletes a booking by its id.
 * @param {string} id - The booking's id.
 * @returns {Promise<object>} Confirmation message.
 * @throws {Error} If booking not found.
 */
async function deleteBooking(id) {
  console.log(`[deleteBooking] Entry: bookingId="${id}"`);
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  let _id;
  try { _id = toObjectId(id); } catch { 
    console.error(`[deleteBooking] Error: Invalid booking id`);
    throw new Error('Invalid booking id'); 
  }

  const result = await bookings.deleteOne({ _id });
  if (result.deletedCount === 0) {
    console.error(`[deleteBooking] Error: Booking not found`);
    throw new Error('Booking not found');
  }

  console.log(`[deleteBooking] Exit: Booking deleted for bookingId="${id}"`);
  return { message: 'Booking deleted' };
}

async function generateBookingID(){
  try {
    const db = client.db("RentWise");
    const bookingsCollection = db.collection("Bookings");

    // Find the booking with the highest bookingId number
    const lastBooking = await bookingsCollection
      .findOne(
        { bookingId: { $exists: true } },
        { sort: { bookingId: -1 } }
      );

    let nextNumber = 1;

    if (lastBooking && lastBooking.bookingId) {
      // Extract the number from the booking ID (e.g., "B-0001" -> 1)
      const lastNumber = parseInt(lastBooking.bookingId.split('-')[1]);
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
  createBooking,
  getAllBookings,
  getBookingById,
  deleteBooking,
  updateBooking,
  generateBookingID
};
