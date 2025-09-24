const favouriteService = require('../service/favouriteService');
const translate = require('../service/translateService');

/**
 * Marks a listing as a favourite for a specific user.
 * Returns a confirmation message as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'userID' and 'listingID' params.
 * @param {import('express').Response} res - Express response object.
 */
exports.favouriteListing = async (req, res) => {
    const userID = req.params.userID;
    const listingID = req.params.listingID;
    console.log(`[favouriteListing] Entry: userID="${userID}", listingID="${listingID}"`);
    try {
        const result = await favouriteService.favouriteListing(userID, listingID);
        console.log(`[favouriteListing] Exit: Listing favourited for userID="${userID}", listingID="${listingID}"`);
        res.status(200).json(result);
    } catch (error) {
        console.error(`[favouriteListing] Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}; 

/**
 * Retrieves all favourite listings for a specific user, translates them to the requested language,
 * and returns the translated listings as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'userID' param and optional 'lang' query.
 * @param {import('express').Response} res - Express response object.
 */
exports.getFavouriteListings = async (req, res) => {
    const userID = req.params.userID;
    const targetLang = req.query.lang || req.user?.preferredLanguage || 'en';
    console.log(`[getFavouriteListings] Entry: userID="${userID}", targetLang="${targetLang}"`);
    try {
        const listings = await favouriteService.getFavouriteListings(userID);
        const translated = await translate.translateAllFavourites(listings, targetLang);
        console.log(`[getFavouriteListings] Exit: Returned ${translated.length} favourites for userID="${userID}"`);
        res.status(200).json(translated);
    } catch (error) {
        console.error(`[getFavouriteListings] Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Removes a listing from a user's favourites.
 * Returns a confirmation message as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'userID' and 'listingID' params.
 * @param {import('express').Response} res - Express response object.
 */
exports.unfavouriteListing = async (req, res) => {
    const userID = req.params.userID;
    const listingID = req.params.listingID;
    console.log(`[unfavouriteListing] Entry: userID="${userID}", listingID="${listingID}"`);
    try {
        const result = await favouriteService.unfavouriteListing(userID, listingID);
        console.log(`[unfavouriteListing] Exit: Listing unfavourited for userID="${userID}", listingID="${listingID}"`);
        res.status(200).json(result);
    } catch (error) {
        console.error(`[unfavouriteListing] Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Retrieves a favourite record by listing ID, translates it to the requested language,
 * and returns the translated favourite as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'listingID' param and optional 'lang' query.
 * @param {import('express').Response} res - Express response object.
 */
exports.getFavouriteByListingId = async (req, res) => {
    const listingID = req.params.listingID;
    const targetLang = req.query.lang || req.user?.preferredLanguage || 'en';
    console.log(`[getFavouriteByListingId] Entry: listingID="${listingID}", targetLang="${targetLang}"`);
    try {
        const favourite = await favouriteService.getFavouriteByListingId(listingID);
        const translated = await translate.translateFavourite(favourite, targetLang);
        console.log(`[getFavouriteByListingId] Exit: Favourite returned for listingID="${listingID}"`);
        res.status(200).json(translated);
    } catch (error) {
        console.error(`[getFavouriteByListingId] Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};