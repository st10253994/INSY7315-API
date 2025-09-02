const favouriteService = require('../service/favouriteService');

exports.favouriteListing = async (req, res) => {
    try {
        const result = await favouriteService.favouriteListing(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.favouriteListings = async (req, res) => {
    try {
        const listings = await favouriteService.favouriteListings();
        res.status(200).json(listings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.unfavouriteListing = async (req, res) => {
    try {
        const result = await favouriteService.unfavouriteListing(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};