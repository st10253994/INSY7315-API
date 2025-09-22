const favouriteService = require('../service/favouriteService');
const translate = require('../service/translateService');

exports.favouriteListing = async (req, res) => {
    try {
        const result = await favouriteService.favouriteListing(req.params.userID, req.params.listingID);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}; 

exports.getFavouriteListings = async (req, res) => {
    try {
        const listings = await favouriteService.getFavouriteListings(req.params.userID);
        const targetLang = req.query.lang || req.user?.preferredLanguage || 'en';
        const translated = await translate.translateAllFavourites(listings, targetLang);
        res.status(200).json(translated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.unfavouriteListing = async (req, res) => {
    try {
        const result = await favouriteService.unfavouriteListing(req.params.userID, req.params.listingID);
        res.status(200).json(result);
        console.log(`unfavourited ${res.statusCode}`);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFavouriteByListingId = async (req, res) => {
    try {
        const favourite = await favouriteService.getFavouriteByListingId(req.params.listingID);
        const targetLang = req.query.lang || req.user?.preferredLanguage || 'en';
        const translated = await translate.translateFavourite(favourite, targetLang);

        res.status(200).json(translated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};