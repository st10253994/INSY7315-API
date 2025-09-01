let reviews = [];

// CREATE
function createReview(data) {
  const { listingId, reviewerName, rating, comment } = data;
    if (!listingId || !reviewerName || !rating || !comment) {
    throw new Error("Missing review details");
    }
    const newReview = {
    id: reviews.length + 1,
    listingId,
    reviewerName,
    rating,
    comment
    };
    reviews.push(newReview);
    return newReview;
}

// GET all
function getAllReviews() {
  return reviews;
}

module.exports = {
  createReview,
  getAllReviews
};