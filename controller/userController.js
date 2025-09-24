const login = require('../service/loginService');
const register = require('../service/registerService');
const profile = require('../service/profileService');

/**
 * Registers a new user with the provided details in the request body.
 * Returns the created user as a JSON response.
 * @param {import('express').Request} req - Express request object, expects user registration data in body.
 * @param {import('express').Response} res - Express response object.
 */
exports.registerUser = async (req, res) => {
    console.log(`[registerUser] Entry: email="${req.body?.email}"`);
    try {
        const newUser = await register.registerUser(req.body);
        res.status(201).json(newUser);
        console.log(`[registerUser] Exit: Registration successful for userId="${newUser?._id}"`);
    } catch (error) {
        console.error(`[registerUser] Error: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Authenticates a user with the provided credentials in the request body.
 * Returns the authenticated user as a JSON response.
 * @param {import('express').Request} req - Express request object, expects login credentials in body.
 * @param {import('express').Response} res - Express response object.
 */
exports.loginUser = async (req, res) => {
    console.log(`[loginUser] Entry: email="${req.body?.email}"`);
    try {
        const user = await login.loginUser(req.body);
        res.status(200).json(user);
        console.log(`[loginUser] Exit: Login successful for userId="${user?.userId}"`);
    } catch (error) {
        console.error(`[loginUser] Error: ${error.message}`);
        res.status(401).json({ error: error.message });
    }
};

/**
 * Updates or creates a user profile for the specified user ID.
 * Accepts profile data and an optional profile image file.
 * Returns the updated profile as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'id' param, body data, and optional file.
 * @param {import('express').Response} res - Express response object.
 */
exports.postUserProfile = async (req, res) => {
    const id = req.params.id;
    const pfpUrl = req.file ? req.file.path : null;
    const data = { ...req.body, pfpImage: pfpUrl };
    console.log(`[postUserProfile] Entry: userId="${id}"`);
    try {
        const userProfile = await profile.postUserProfile(id, data);
        res.status(201).json(userProfile);
        console.log(`[postUserProfile] Exit: Profile updated for userId="${id}"`);
    } catch (error) {
        console.error(`[postUserProfile] Error: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Retrieves a user profile by user ID.
 * Returns the user profile as a JSON response.
 * @param {import('express').Request} req - Express request object, expects 'id' param.
 * @param {import('express').Response} res - Express response object.
 */
exports.getUserById = async (req, res) => {
    const id = req.params.id;
    console.log(`[getUserById] Entry: userId="${id}"`);
    try {
        const user = await profile.getProfileById(id);
        res.status(200).json(user);
        console.log(`[getUserById] Exit: Profile returned for userId="${id}"`);
    } catch (error) {
        console.error(`[getUserById] Error: ${error.message}`);
        res.status(404).json({ error: error.message });
    }
};