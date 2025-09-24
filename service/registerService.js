const { client } = require('../database/db');
const bcrypt = require('bcrypt');

/**
 * Registers a new user with email and password.
 * Hashes the password, checks for duplicates, and creates default user settings.
 * @param {object} data - Registration data (email, password).
 * @returns {Promise<object>} Registration result with user id and info.
 * @throws {Error} If registration fails or user already exists.
 */
async function registerUser(data) {
    console.log(`[registerUser] Entry: email="${data?.email}"`);
    const { email, password } = data;

    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    try {
        const db = client.db('RentWise'); 
        const systemUsers = db.collection('System-Users'); 
        const userSettings = db.collection('User-Settings'); 

        // Check if user already exists
        const existingUser = await systemUsers.findOne({ email });
        if (existingUser) {
            throw new Error("User already exists");
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
            email,
            password: hashedPassword,
            createdAt: new Date()
        };

        // Insert into System-Users
        const result = await systemUsers.insertOne(newUser);
        if (!result.acknowledged) {
            throw new Error("Failed to insert user");
        }

        const userId = result.insertedId;

        // Insert default profile into User-Settings
        const newSettings = {
            userId,
            profile: {
                username: "",
                firstName: "",
                surname: "",
                email: email,
                phone: "",
                DoB: "",
                preferredLanguage: "",
                pfpImage: ""
            },
            createdAt: new Date()
        };

        await userSettings.insertOne(newSettings);

        // Return safe response
        console.log(`[registerUser] Exit: User registered with id="${userId}"`);
        return {
            _id: userId,
            email: newUser.email,
            createdAt: newUser.createdAt, 
            message: "User registered Successfully"
        };

    } catch (error) {
        console.error(`[registerUser] Error: ${error.message}`);
        throw new Error(`Error registering user: ${error.message}`);
    }
}

module.exports = { registerUser };