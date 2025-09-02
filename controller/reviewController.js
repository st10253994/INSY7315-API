const reviewService = require('../service/reviewService');

//create review
exports.createReview = async (req, res) => {
  try {
    const data = req.body;
    const result = await reviewService.createReview(req.params.id, data);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

//get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getAllReviews();
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

