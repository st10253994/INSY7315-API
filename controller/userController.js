const login = require('../service/loginService');
const register = require('../service/registerService');
const profile = require('../service/profileService');

exports.registerUser = async (req, res) => {
    try {
        console.log(`Registration Request received ${JSON.stringify(req.body, null, 2)}`);
        const newUser = await register.registerUser(req.body);
        res.status(201).json(newUser);
        console.log(`Registration was successful: ${res.statusCode}`);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        console.log(`Login Request received ${JSON.stringify(req.body, null, 2)}`);
        const user = await login.loginUser(req.body);
        res.status(200).json(user);
        console.log(`Login was successful: ${res.statusCode}`);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

exports.postUserProfile = async (req, res) => {
    try {
        const userProfile = await profile.postUserProfile({userId: req.params.id, ...req.body});
        res.status(201).json(userProfile);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await profile.getProfileById(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};