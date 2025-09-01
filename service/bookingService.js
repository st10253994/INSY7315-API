let bookings = [];

// CREATE
function createBooking(data) {
  const { customerName, date, service } = data;
  if (!customerName || !date || !service) {
    throw new Error("Missing booking details");
  }

  const newBooking = {
    id: bookings.length + 1,
    customerName,
    date,
    service,
  };

  bookings.push(newBooking);
  return newBooking;
}

// READ all
function getAllBookings() {
  return bookings;
}

// READ one by id
function getBookingById(id) {
  const booking = bookings.find((b) => b.id == id);
  if (!booking) throw new Error("Booking not found");
  return booking;
}

// UPDATE
function updateBooking(id, data) {
  const booking = bookings.find((b) => b.id == id);
  if (!booking) throw new Error("Booking not found");

  const { customerName, date, service } = data;
  if (customerName) booking.customerName = customerName;
  if (date) booking.date = date;
  if (service) booking.service = service;

  return booking;
}

// DELETE
function deleteBooking(id) {
  const index = bookings.findIndex((b) => b.id == id);
  if (index === -1) throw new Error("Booking not found");

  bookings.splice(index, 1);
  return { message: "Booking deleted" };
}

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking
};