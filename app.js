const express = require('express');
const app = express();
const { connectMongo } = require('./database/db');
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Parse JSON bodies

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

// Connect to MongoDB
connectMongo();

// Controllers
const bookingController = require('./controller/bookingController');
const listingController = require('./controller/listingController');
const reviewController = require('./controller/reviewController');
const userController = require('./controller/userController');
const notificationController = require('./controller/notificationController');
const favouriteController = require('./controller/favouriteController');

// Booking Routes
app.get('/api/bookings', bookingController.getAllBookings);
app.post('/api/bookings/:id/create', bookingController.createBooking);
app.get('/api/bookings/:id', bookingController.getBookingById);
app.delete('/api/bookings/:id/delete', bookingController.deleteBooking);
app.put('/api/bookings/:id/update', bookingController.updateBooking);

// Listing Routes
app.get('/api/listings', listingController.getAllListings);
app.post('/api/listings/create', listingController.createListing);
app.get('/api/listings/:id', listingController.getListingById);
app.delete('/api/listings/:id/delete', listingController.deleteListing);

// Favourite Routes
app.post('/api/:id/favourite', favouriteController.favouriteListing);
app.get('/api/favourites', favouriteController.favouriteListings);
app.delete('/api/:id/unfavourite', favouriteController.unfavouriteListing);

// Review Routes
app.get('/api/reviews', reviewController.getAllReviews);
app.post('/api/reviews/create', reviewController.createReview);

// User Routes
app.post('/api/users/register', userController.registerUser);
app.post('/api/users/login', userController.loginUser);
app.get('/api/users/:id', userController.getUserById);
app.post('/api/users/:id/profile', userController.postUserProfile);

// Notification Routes
app.get('/api/notifications', notificationController.getAllNotifications);
app.post('/api/notifications/create', notificationController.createNotification);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});