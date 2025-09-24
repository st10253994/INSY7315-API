const reviewService = require('../service/reviewService');

/**
 * Creates a new review for a specific listing by a user.
 * Accepts review details in the request body.
 * Returns the created review as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'userID', 'listingID' params and body data.
 * @param {import('express').Response} res - Express response object.
 */
exports.createReview = async (req, res) => {
  const userID = req.params.userID;
  const listingID = req.params.listingID;
  console.log(`[createReview] Entry: userID="${userID}", listingID="${listingID}"`);
  try {
    const data = req.body;
    const result = await reviewService.createReview(userID, listingID, data);
    console.log(`[createReview] Exit: Review created for userID="${userID}", listingID="${listingID}"`);
    res.status(201).json(result);
  } catch (error) {
    console.error(`[createReview] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieves all reviews for a specific listing.
 * Returns the reviews as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'listingID' param.
 * @param {import('express').Response} res - Express response object.
 */
exports.getAllReviews = async (req, res) => {
  const listing = req.params.listingID;
  console.log(`[getAllReviews] Entry: listingID="${listing}"`);
  try {
    const reviews = await reviewService.getAllReviews(listing);
    console.log(`[getAllReviews] Exit: Found ${reviews.length} reviews for listingID="${listing}"`);
    res.status(200).json(reviews);
  } catch (error) {
    console.error(`[getAllReviews] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

