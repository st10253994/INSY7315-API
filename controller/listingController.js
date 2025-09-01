const listingService = require('../service/listingService');

exports.getAllListings = async (req, res) => {
  try {
    const listings = await listingService.getAllListings();
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }};

exports.createListing = async (req, res) => {
  try {
    const newListing = await listingService.createListing(req.body);
    res.status(201).json(newListing);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }};

exports.getListingById = async (req, res) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    res.status(200).json(listing);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }};

exports.deleteListing = async (req, res) => {
  try {
    const result = await listingService.deleteListing(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }};

