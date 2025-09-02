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
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  const {startDate, endDate, guestAmount } = data;

  if (!startDate || !endDate || !guestAmount) {
    throw new Error('Missing required booking fields');
  }

  const newBooking = {
    listingId: toObjectId(id),
    guestAmount: data.guestAmount,
    startDate: data.startDate,
    endDate: data.endDate,
    createdAt: new Date(),
    status: 'pending'
  };

  const result = await bookings.insertOne(newBooking);
  return { _id: result.insertedId, ...newBooking };
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
