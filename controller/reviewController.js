const reviewService = require('../service/reviewService');

exports.getAllReviews = (req, res) => {
  try {
    const reviews = reviewService.getAllReviews();
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }};

exports.createReview = (req, res) => {
  try {
    const newReview = reviewService.createReview(req.body);
    res.status(201).json(newReview);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }};