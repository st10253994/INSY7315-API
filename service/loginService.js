const { client } = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function loginUser(data) {
    const { email, password } = data;

    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    try {
        const db = client.db('RentWise');
        const systemUsers = db.collection('System-Users');

        // Find user by email
        const user = await systemUsers.findOne({ email });
        if (!user) {
            throw new Error("Invalid email or password");
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid email or password");
        }

        // Generate JWT token
        const token = jwt.sign(
        { email },
        "ThisIsTheStringForMyTokenGenerationThisIsSecure",
        { expiresIn: "1h" }
        );

        // Return safe response
        return {
            message: "Login successful",
            userId: user._id,
            email: user.email, 
            token: token
        };
    } catch (error) {
        throw new Error(`Error logging in: ${error.message}`);
    }
}

module.exports = {
    loginUser
};