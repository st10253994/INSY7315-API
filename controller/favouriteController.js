const favouriteService = require('../service/favouriteService');

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
        res.status(200).json(listings);
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