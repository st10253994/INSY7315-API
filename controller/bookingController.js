const bookingService = require('../service/bookingService');

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = bookingService.getAllBookings();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }};

exports.createBooking = async (req, res) => {
  try {
    const newBooking = bookingService.createBooking(req.body);
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }};

exports.getBookingById = async (req, res) => {
  try {
    const booking = bookingService.getBookingById(req.params.id);
    res.status(200).json(booking);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }};

  exports.updateBooking = async (req, res) => {
  try {
    const updatedBooking = bookingService.updateBooking(req.params.id, req.body);
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }};

exports.deleteBooking = async (req, res) => {
  try {
    const result = bookingService.deleteBooking(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }};