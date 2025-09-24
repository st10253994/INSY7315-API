const e = require('express');
const bookingService = require('../service/bookingService');

/**
 * Retrieves all bookings from the database and returns them as a JSON response.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.getAllBookings = async (req, res) => {
  console.log(`[getAllBookings] Entry`);
  try {
    const bookings = await bookingService.getAllBookings();
    console.log(`[getAllBookings] Exit: Found ${bookings.length} bookings`);
    res.status(200).json(bookings);
  } catch (error) {
    console.error(`[getAllBookings] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Creates a new booking using the provided user ID, listing ID, request body, and uploaded files.
 * Returns the newly created booking as a JSON response.
 * @param {import('express').Request} req - Express request object, expects files and body data.
 * @param {import('express').Response} res - Express response object.
 */
exports.createBooking = async (req, res) => {
  const userID = req.params.userID;
  const listingID = req.params.listingID;
  console.log(`[createBooking] Entry: userID="${userID}", listingID="${listingID}"`);
  try {
    const files = req.files || [];

    if (!files.length) {
      console.log("[createBooking] No files uploaded");
    }

    // Collect Cloudinary URLs instead of local paths
    const supportDocuments = files.map(file => ({
      url: file.path,          // Cloudinary URL
      public_id: file.filename // Cloudinary public ID (for deletion/management later)
    }));

    const data = { 
      ...req.body, 
      supportDocuments 
    };
    console.log("[createBooking] request body:", req.body);
    console.log("[createBooking] request files:", req.files);
    console.log("[createBooking] merged data:", data);

    const newBooking = await bookingService.createBooking(userID, listingID, data);

    console.log(`[createBooking] Exit: Booking created with id="${newBooking?.bookingID}"`);
    res.status(201).json(newBooking);
  } catch (error) {
    console.error(`[createBooking] Error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Retrieves a single booking by its unique ID and returns it as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'id' param.
 * @param {import('express').Response} res - Express response object.
 */
exports.getBookingById = async (req, res) => {
  const bookingId = req.params.id;
  console.log(`[getBookingById] Entry: bookingId="${bookingId}"`);
  try {
    const booking = await bookingService.getBookingById(bookingId);
    console.log(`[getBookingById] Exit: Booking found for bookingId="${bookingId}"`);
    res.status(200).json(booking);
  } catch (error) {
    console.error(`[getBookingById] Error: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

/**
 * Updates an existing booking by its unique ID using the provided request body.
 * Returns the updated booking as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'id' param and body data.
 * @param {import('express').Response} res - Express response object.
 */
exports.updateBooking = async (req, res) => {
  const bookingId = req.params.id;
  console.log(`[updateBooking] Entry: bookingId="${bookingId}"`);
  try {
    const updatedBooking = await bookingService.updateBooking(bookingId, req.body);
    console.log(`[updateBooking] Exit: Booking updated for bookingId="${bookingId}"`);
    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error(`[updateBooking] Error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Deletes a booking by its unique ID.
 * Returns a confirmation message if successful, or an error if not found.
 * @param {import('express').Request} req - Express request object, expects 'id' param.
 * @param {import('express').Response} res - Express response object.
 */
exports.deleteBooking = async (req, res) => {
  const bookingId = req.params.id;
  console.log(`[deleteBooking] Entry: bookingId="${bookingId}"`);
  try {
    const result = await bookingService.deleteBooking(bookingId);
    console.log(`[deleteBooking] Exit: Booking deleted for bookingId="${bookingId}"`);
    res.status(200).json(result);
  } catch (error) {
    console.error(`[deleteBooking] Error: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};