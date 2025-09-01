const { client } = require('../database/db');
const bcrypt = require('bcrypt'); // ✅ correct import

async function registerUser(data) {
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

        // ✅ Insert into System-Users
        const result = await systemUsers.insertOne(newUser);
        if (!result.acknowledged) {
            throw new Error("Failed to insert user");
        }

        const userId = result.insertedId;

        // ✅ Insert into User-Settings (linked by userId)
        const newSettings = {
            userId,
            email,
            createdAt: new Date(),
            profile: {},  // placeholder for future profile info/settings
        };

        await userSettings.insertOne(newSettings);

        // Return safe response
        return {
            _id: userId,
            email: newUser.email,
            createdAt: newUser.createdAt, 
            message: "User registered Successfully"
        };

    } catch (error) {
        throw new Error(`Error registering user: ${error.message}`);
    }
}

module.exports = { registerUser };