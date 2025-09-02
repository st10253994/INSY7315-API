const express = require('express');
const app = express();
const { connectMongo } = require('./database/db');
const { checkAuth } = require('./Auth/checkAuth')
const { upload } = require('./database/cloudinary');

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
app.get('/api/bookings', checkAuth, bookingController.getAllBookings);
app.post('/api/bookings/:id/create', checkAuth, bookingController.createBooking);
app.get('/api/bookings/:id', checkAuth, bookingController.getBookingById);
app.delete('/api/bookings/:id/delete', checkAuth, bookingController.deleteBooking);
app.put('/api/bookings/:id/update', checkAuth, bookingController.updateBooking);

// Listing Routes
app.get('/api/listings', checkAuth, listingController.getAllListings);
app.post('/api/listings/create', checkAuth, upload.array('images', 10), listingController.createListing);
app.get('/api/listings/:id', checkAuth, listingController.getListingById);
app.delete('/api/listings/:id/delete', checkAuth, listingController.deleteListing);

// Favourite Routes
app.post('/api/:id/favourite', checkAuth, favouriteController.favouriteListing);
app.get('/api/favourites', checkAuth, favouriteController.favouriteListings);
app.delete('/api/:id/unfavourite', checkAuth, favouriteController.unfavouriteListing);

// Review Routes
app.get('/api/reviews', checkAuth, reviewController.getAllReviews);
app.post('/api/reviews/:id/create', checkAuth, reviewController.createReview);

// User Routes
app.post('/api/users/register', userController.registerUser);
app.post('/api/users/login', userController.loginUser);
app.get('/api/users/:id', userController.getUserById);
app.post('/api/users/:id/profile', userController.postUserProfile);

// Notification Routes
app.get('/api/notifications', checkAuth, notificationController.getAllNotifications);
app.post('/api/notifications/create', checkAuth, notificationController.createNotification);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});