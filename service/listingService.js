
let listings = [];

// CREATE
function createListing(data) {
  const { title, description, price } = data;
  if (!title || !description || !price) {
    throw new Error("Missing listing details");
  }

  const newListing = {
    id: listings.length + 1,
    title,
    description,
    price
  };

  listings.push(newListing);
  return newListing;
}

// READ all
function getAllListings() {
  return listings;
}

// READ one
function getListingById(id) {
  const listing = listings.find((l) => l.id == id);
  if (!listing) throw new Error("Listing not found");
  return listing;
}

// UPDATE
function updateListing(id, data) {
  const listing = listings.find((l) => l.id == id);
  if (!listing) throw new Error("Listing not found");

  const { title, description, price } = data;
  if (title) listing.title = title;
  if (description) listing.description = description;
  if (price) listing.price = price;

  return listing;
}

// DELETE
function deleteListing(id) {
  const index = listings.findIndex((l) => l.id == id);
  if (index === -1) throw new Error("Listing not found");

  listings.splice(index, 1);
  return { message: "Listing deleted" };
}

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing
};