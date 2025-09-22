const listingService = require('../service/listingService');
const {translateText, translateFields} = require('../service/translateService');

exports.getAllListings = async (req, res) => {
  try {
    const listings = await listingService.getAllListings();
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }};

exports.createListing = async (req, res) => {
  try {
    const files = req.files || [];
    const id = req.params.id; // Get landlord ID from URL parameters

    if (!files.length) {
      console.log("No files uploaded");
    }

    const imageUrls = files.map(file => file.path);
    const data = { ...req.body, imagesURL: imageUrls };

    const newListing = await listingService.createListing(id, data);
    res.status(201).json(newListing);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};


exports.getListingById = async (req, res) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    if(!listing){
      return res.status(404).json({error: "Listing not found"});
    }

    //Determine target language
    const targetLang = req.query.lang || 'en';

    if (targetLang !== 'en') {
      // translate fields dynamically
      if (listing.title) {
        listing.title = await translateText(listing.title, targetLang);
      }
      if (listing.description) {
        listing.description = await translateText(listing.description, targetLang);
      }
      if (Array.isArray(listing.amenities)) {
        listing.amenities = await translateFields(listing.amenities, targetLang);
      }
    }

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

