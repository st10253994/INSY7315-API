const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { client } = require('../database/db');
const { ObjectId } = require('mongodb');
dotenv.config();

function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string') return new ObjectId(id);
  throw new Error("Invalid id format");
}

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

    // ✅ safer to fetch by decoded.userId (not just email)
    const user = await systemUsers.findOne({ _id: toObjectId(decoded.userId) });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    console.log("👤 Found user:", user ? "YES" : "NO"); // ← ADD THIS

    const profileDoc = await userSettings.findOne({ userId: toObjectId(user._id) });
    const profile = profileDoc?.profile || {};

    console.log("User profile", profile);

    delete user.password;
    delete user.preferredLanguage;

    req.user = {
      ...user, // base info like _id, email, role
      profile, // full profile object
      preferredLanguage: profile.prefferedLanguage || 'en' // shortcut
    };

    console.log("🔍 checkAuth - FINAL req.user.preferredLanguage:", req.user.preferredLanguage);
    console.log("🔍 checkAuth - FINAL req.user keys:", Object.keys(req.user));

    next();
  } catch (err) {
    console.error("checkAuth error:", err.message);
    res.status(401).json({ message: "Your session is expired. Please login again." });
  }
};

module.exports = { checkAuth };