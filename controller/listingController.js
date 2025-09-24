const listingService = require('../service/listingService');
const translate = require('../service/translateService');

/**
 * Retrieves all property listings, translates them to the requested language,
 * and returns the translated listings as a JSON response.
 * @param {import('express').Request} req - Express request object, may include 'lang' query param.
 * @param {import('express').Response} res - Express response object.
 */
exports.getAllListings = async (req, res) => {
  console.log(`[getAllListings] Entry`);
  try {
    const listings = await listingService.getAllListings();
    const targetLang = req.query.lang || req.user?.preferredLanguage || 'en';
    const translated = await translate.translateAllListings(listings, targetLang);

    console.log(`[getAllListings] Exit: Returned ${translated.length} listings`);
    res.status(200).json(translated);
  } catch (error) {
    console.error(`[getAllListings] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Creates a new property listing using the provided data and uploaded images.
 * Returns the newly created listing as a JSON response.
 * @param {import('express').Request} req - Express request object, expects files and body data.
 * @param {import('express').Response} res - Express response object.
 */
exports.createListing = async (req, res) => {
  const id = req.params.id;
  console.log(`[createListing] Entry: landlordId="${id}"`);
  try {
    const files = req.files || [];

    if (!files.length) {
      console.log("[createListing] No files uploaded");
    }

    const imageUrls = files.map(file => file.path);
    const data = { ...req.body, imagesURL: imageUrls };

    const newListing = await listingService.createListing(id, data);
    console.log(`[createListing] Exit: Listing created with id="${newListing?.listingId}"`);
    res.status(201).json(newListing);
  } catch (error) {
    console.error(`[createListing] Error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Retrieves a single property listing by its unique id, translates it to the requested language,
 * and returns the translated listing as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'id' param and optional 'lang' query.
 * @param {import('express').Response} res - Express response object.
 */
exports.getListingById = async (req, res) => {
  const listingId = req.params.id;
  console.log(`[getListingById] Entry: listingId="${listingId}"`);
  try {
    const listing = await listingService.getListingById(listingId);
    if (!listing) {
      console.log(`[getListingById] Exit: Listing not found`);
      return res.status(404).json({ error: "Listing not found" });
    }

    const targetLang = req.query.lang || req.user?.preferredLanguage || 'en';
    const translated = await translate.translateListing(listing, targetLang);

    console.log(`[getListingById] Exit: Listing returned for listingId="${listingId}"`);
    res.status(200).json(translated);
  } catch (error) {
    console.error(`[getListingById] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Deletes a property listing by its unique id.
 * Returns a confirmation message if successful, or an error if not found.
 * @param {import('express').Request} req - Express request object, expects 'id' param.
 * @param {import('express').Response} res - Express response object.
 */
exports.deleteListing = async (req, res) => {
  const listingId = req.params.id;
  console.log(`[deleteListing] Entry: listingId="${listingId}"`);
  try {
    const result = await listingService.deleteListing(listingId);
    console.log(`[deleteListing] Exit: Listing deleted for listingId="${listingId}"`);
    res.status(200).json(result);
  } catch (error) {
    console.error(`[deleteListing] Error: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

