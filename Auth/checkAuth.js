const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { client } = require('../database/db');
const { ObjectId } = require('mongodb');
dotenv.config();

function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  throw new Error("Invalid id format");
}

/**
 * Middleware to authenticate and authorize requests using JWT tokens.
 * Verifies the token from the Authorization header and attaches user information to the request object.
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers.authorization - Authorization header containing the JWT token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {Error} If token verification fails or user is not found
 * @returns {void}
 * 
 * The middleware:
 * 1. Extracts and validates JWT token from Authorization header
 * 2. Decodes token and searches for user in database
 * 3. Attempts to find user by multiple identifiers (ObjectId, googleId, email)
 * 4. Retrieves user profile settings
 * 5. Attaches sanitized user data to request object
 * 
 * On failure, returns 401 status with error message
 */
const checkAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = client.db('RentWise');
    const systemUsers = db.collection('System-Users');
    const userSettings = db.collection('User-Settings');

    let user;
    

    try {
      user = await systemUsers.findOne({ _id: toObjectId(decoded.userId) });
    } catch (err) {

      user = await systemUsers.findOne({ googleId: decoded.userId });
      
      if (!user && decoded.email) {
        user = await systemUsers.findOne({ email: decoded.email });
      }
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const profileDoc = await userSettings.findOne({ userId: toObjectId(user._id) });
    const profile = profileDoc?.profile || {};

    //Remove user password and preferredLanguage from the user object
    delete user.password;
    delete user.preferredLanguage;

    req.user = {
      ...user, 
      profile, 
      preferredLanguage: profile.preferredLanguage || 'en'
    };

    next();
  } catch (err) {
    console.error("checkAuth error:", err.message);
    res.status(401).json({ message: "Your session is expired. Please login again." });
  }
};

module.exports = { checkAuth };