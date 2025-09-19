const reviewService = require('../service/reviewService');

//create review
exports.createReview = async (req, res) => {
  try {
    const data = req.body;
    const userID = req.params.userID;
    const listingID = req.params.listingID
    const result = await reviewService.createReview(userID, listingID, data);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

//get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    listing = req.params.listingID;
    const reviews = await reviewService.getAllReviews(listing);
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

