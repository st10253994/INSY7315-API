// service/bookingService.js
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

// CREATE
async function createBooking(id, data) {
  try{
    const db = client.db('RentWise');
    const bookingsCollection = db.collection('Bookings');

    const { checkInDate, CheckOutDate, numberOfGuests, supportDocuments = [] } = data;

    if (!checkInDate || !CheckOutDate || !numberOfGuests) {
      throw new Error('Check-in date, check-out date, and number of guests are required');
    }
    //if you give a single document, convert to array
    if (typeof supportDocuments === 'string') {
      data.supportDocuments = [supportDocuments];
    }
    //if supportDocuments is not an array, throw error
    if (!Array.isArray(supportDocuments)) {
      throw new Error('supportDocuments must be an array of strings');
    }
    // Ensure listing ID is valid
    const listingObjectId = toObjectId(id);
    const listing = await db.collection('Listings').findOne({ _id: listingObjectId });
    if (!listing) {
      throw new Error('Listing not found');
    }
    const newBooking = {
        listing: ObjectId(id),
        checkInDate,
        CheckOutDate,
        numberOfGuests,
        supportDocuments,
        status: 'Pending',
        createdAt: new Date()
    };
    const result = await bookingsCollection.insertOne(newBooking);
    return { message: 'Booking created', bookingID: result.insertedId };
  }
  catch (error) {
    throw new Error('Error creating booking: ' + error.message);
  }
}

// READ all
async function getAllBookings() {
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  const docs = await bookings.find({}).toArray();
  return docs
}

// READ one by id
async function getBookingById(id) {
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  const booking = await bookings.findOne({ _id: toObjectId(id) });
  if (!booking) throw new Error('No Booking Was Found');
  
  return booking;
}

//update 
async function updateBooking(id, data) {
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
  if (result.matchedCount === 0) throw new Error('Booking not found');
  if (result.modifiedCount === 0) throw new Error('No changes were made to the booking');

  return { message: 'Booking updated' };
}


// DELETE
async function deleteBooking(id) {
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  let _id;
  try { _id = toObjectId(id); } catch { throw new Error('Invalid booking id'); }

  const result = await bookings.deleteOne({ _id });
  if (result.deletedCount === 0) throw new Error('Booking not found');

  return { message: 'Booking deleted' };
}

module.exports = {
  createBooking,   // working
  getAllBookings,  // now defined
  getBookingById, // working
  deleteBooking,   // mongo-based
  updateBooking   // newly added
};
