// service/bookingService.js
const { client } = require('../database/db');
const { ObjectId } = require('mongodb');

function toObjectId(id) {
  if (id instanceof ObjectId) return id; // already valid
  if (typeof id === "string") return new ObjectId(id); 
  throw new Error("Invalid id format");
}

// CREATE
async function createBooking(data) {
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  const { customerName, date, service } = data;
  if (!customerName || !date || !service) {
    throw new Error('Missing booking details');
  }

  const newBooking = { customerName, date, service };
  const result = await bookings.insertOne(newBooking);

  if (!result.acknowledged) throw new Error('Failed to create Booking');

  return {
    _Id: result.insertedId.toString(),
    customer: newBooking.customerName,
    date: newBooking.date,
    service: newBooking.service,
    message: 'Booking successfully created',
  };
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

// UPDATE (partial)
async function updateBooking(id, data) {
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  let _id;
  try { _id = new ObjectId(id); } catch { throw new Error('Invalid booking id'); }

  const { customerName, date, service } = data;
  const update = {};
  if (customerName !== undefined) update.customerName = customerName;
  if (date !== undefined) update.date = date;
  if (service !== undefined) update.service = service;

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields to update');
  }

  const result = await bookings.findOneAndUpdate(
    { _id },
    { $set: update },
    { returnDocument: 'after' }
  );

  if (!result.value) throw new Error('Booking not found');

  const b = result.value;
  return {
    _Id: b._id.toString(),
    customer: b.customerName,
    date: b.date,
    service: b.service,
    message: 'Booking updated',
  };
}

// DELETE
async function deleteBooking(id) {
  const db = client.db('RentWise');
  const bookings = db.collection('Bookings');

  let _id;
  try { _id = new ObjectId(id); } catch { throw new Error('Invalid booking id'); }

  const result = await bookings.deleteOne({ _id });
  if (result.deletedCount === 0) throw new Error('Booking not found');

  return { message: 'Booking deleted' };
}

module.exports = {
  createBooking,   // working
  getAllBookings,  // now defined
  getBookingById,  // deduped & correct
  updateBooking,   // mongo-based
  deleteBooking,   // mongo-based
};
