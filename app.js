const express = require('express');
const app = express();
const { connectMongo } = require('./database/db');
const { checkAuth } = require('./Auth/checkAuth')
const { upload, uploadFiles, maintenanceUpload } = require('./database/cloudinary');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

app.use(express.json()); // Parse JSON bodies
app.use(cors()) // Enable CORS for all routes

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
const maintenanceController = require('./controller/maintenanceController');

// Booking Routes
app.get('/api/bookings', checkAuth, bookingController.getAllBookings);
app.post('/api/bookings/:userID/:listingID/create', checkAuth, uploadFiles.array('supportDocuments', 10),  bookingController.createBooking);
app.get('/api/bookings/:id', checkAuth, bookingController.getBookingById);
app.delete('/api/bookings/:id/delete', checkAuth, bookingController.deleteBooking);
app.put('/api/bookings/:id/update', checkAuth, bookingController.updateBooking);

// Listing Routes
app.get('/api/listings', checkAuth, listingController.getAllListings);
app.post('/api/:id/listings/create', checkAuth, upload.array('imageURL', 10), listingController.createListing);
app.get('/api/listings/:id', checkAuth, listingController.getListingById);
app.delete('/api/listings/:id/delete', checkAuth, listingController.deleteListing);

// Favourite Routes
app.post('/api/:userID/:listingID/favourite', checkAuth, favouriteController.favouriteListing);
app.get('/api/:userID/favourites', checkAuth, favouriteController.getFavouriteListings);
app.delete('/api/:userID/:listingID/unfavourite', checkAuth, favouriteController.unfavouriteListing);
app.get('/api/favourite/:listingID', checkAuth, favouriteController.getFavouriteByListingId);

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

// Maintenance Routes
app.post('/api/:userID/:listingID/maintenance/request/create', checkAuth, maintenanceUpload.array('documentURL', 10), maintenanceController.createMaintenanceRequest);
app.get('/api/:userID/maintenance/request', checkAuth, maintenanceController.getMaintenanceRequestForUserId);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});