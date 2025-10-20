const userService = require('../service/userService.js');
const profileService = require('../service/profileService.js');

exports.register = async (req, res) => {
    try{
        const userData = req.body;
        const newUser = await userService.registerUser(userData);
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: newUser
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Registration failed",
            error: error.message 
        });
    }
};

exports.login = async (req, res) => {
    try {
        const userData = req.body;
        const result = await userService.loginUser(userData);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: "Login failed",
            error: error.message 
        });
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