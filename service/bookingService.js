// service/bookingService.js
const { client } = require('../database/db');
const { ObjectId } = require('mongodb');
const listingDetails = require('./listingService');

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
async function createBooking(userID, listingID, data) {
  try{
    const db = client.db('RentWise');
    const bookingsCollection = db.collection('Bookings');

    const { checkInDate, checkOutDate, numberOfGuests, supportDocuments = [], totalPrice } = data;

    //Cast total price to a float and validate
    const parsedPrice = parseFloat(totalPrice);
    if (isNaN(parsedPrice)) {
      throw new Error('Total Price must be a valid number');
    }

    if (!checkInDate || !checkOutDate || !numberOfGuests) {
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

    const newBooking = {
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

  const booking = await bookings.findOne({ userId: toObjectId(id), 'newBooking.status': { $nin: ['Active', 'Completed', 'Cancelled'] }});
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
