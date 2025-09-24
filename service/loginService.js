const { client } = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const { ObjectId } = require('mongodb');
dotenv.config();

/**
 * Converts a value to a MongoDB ObjectId if valid.
 * @param {string|ObjectId} id - The id to convert.
 * @returns {ObjectId}
 * @throws {Error} If the id is not a valid ObjectId.
 */
function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === "string") return new ObjectId(id); 
  throw new Error("Invalid id format");
}

/**
 * Authenticates a user by email and password.
 * Returns a JWT token and user info if successful.
 * @param {object} data - Login credentials (email, password).
 * @returns {Promise<object>} Login result with token and user info.
 * @throws {Error} If authentication fails.
 */
async function loginUser(data) {
    console.log(`[loginUser] Entry: email="${data?.email}"`);
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
            console.error(`[loginUser] Error: Invalid email or password`);
            throw new Error("Invalid email or password");
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.error(`[loginUser] Error: Invalid email or password`);
            throw new Error("Invalid email or password");
        }

        // Generate JWT token
        const token = jwt.sign(
            { email, userId: toObjectId(user._id) },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Return safe response
        console.log(`[loginUser] Exit: Login successful for userId="${user._id}"`);
        return {
            message: "Login successful",
            userId: user._id,
            email: user.email, 
            token: token
        };
    } catch (error) {
        console.error(`[loginUser] Error: ${error.message}`);
        throw new Error(`Error logging in: ${error.message}`);
    }
}

module.exports = {
    loginUser
};