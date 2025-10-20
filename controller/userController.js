const userService = require('../service/userService.js');
const profileService = require('../service/profileService.js');

exports.register = async (req, res) => {
    try{
        const userData = req.body;
        const newUser = await userService.registerUser(userData);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const userData = req.body;
        const token = await userService.loginUser(userData);
        res.status(200).json({ token });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await profileService.getProfileById(id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.postUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const profileData = req.body;
        
        // If there's a file uploaded, add it to the profileData
        if (req.file) {
            profileData.profilePicture = req.file.path;
        }
        
        const updatedProfile = await profileService.postUserProfile(id, profileData);
        res.status(200).json(updatedProfile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};