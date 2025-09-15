const e = require('express');
const bookingService = require('../service/bookingService');

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getAllBookings();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }};

exports.createBooking = async (req, res) => {
  try {
    const files = req.files || [];
    const userID = req.params.userID;
    const listingID = req.params.listingID // Listing ID from URL parameters

    if (!files.length) {
      console.log("No files uploaded");
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

    const newBooking = await bookingService.createBooking(userID, listingID, data);

    res.status(201).json(newBooking);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    res.status(200).json(booking);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }};

  exports.updateBooking = async (req, res) => {
    try {
      const updatedBooking = await bookingService.updateBooking(req.params.id, req.body);
      res.status(200).json(updatedBooking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };


exports.deleteBooking = async (req, res) => {
  try {
    const result = await bookingService.deleteBooking(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }};