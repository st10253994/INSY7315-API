const { client } = require('../database/db');
const profileService = require('./profileService');
const { ObjectId } = require('mongodb');

/**
 * @better
 * Converts a given id to a MongoDB ObjectId if possible.
 * Throws an error if the id is not a valid ObjectId string.
 * @param {string|ObjectId} id - The id to convert.
 * @returns {ObjectId}
 */
function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  throw new Error("Invalid ID format");
}

/**
 * @better
 * Service class for handling Google Sign-In related user operations.
 * Provides methods to find, create, and retrieve users by Google ID or database ID.
 */
class googleSignInService {
  constructor() {
    /**
     * @type {import('mongodb').Collection}
     * @description MongoDB collection for system users.
     */
    this.collection = client.db('RentWise').collection('System-Users');
  }

  /**
   * @better
   * Finds a user in the database by their Google ID.
   * @param {string} googleId - The Google account ID.
   * @returns {Promise<Object|null>} The user object if found, otherwise null.
   */
  async findUserByGoogleId(googleId) {
    return await this.collection.findOne({ googleId });
  }

  /**
   * @better
   * Creates a new user in the database using Google account data.
   * Also creates a corresponding user profile.
   * @param {Object} userData - The Google user data (name, email, pfpImage, etc).
   * @returns {Promise<Object>} The newly created user object with its database ID.
   */
  async createUser(userData) {
    const user = {
      ...userData,
      role: 'tenant',
      createdAt: new Date(),
    };

    // Safely split the name, with fallbacks
    const parts = userData.name ? userData.name.split(' ') : [];
    const firstName = userData.firstName || parts[0] || 'Unknown';
    const surname = userData.surname || parts[1] || 'User';

    console.log(user);

    const profile = {
      firstName: firstName,
      surname: surname,
      email: userData.email,
      profilePicture: userData.pfpImage
    };

    const result = await this.collection.insertOne(user);
    const userId = result.insertedId;
    await profileService.postUserProfile(userId, profile);
    return { _id: result.insertedId, ...user };
  }

  /**
   * @better
   * Retrieves a user from the database by their unique database ID.
   * @param {string|ObjectId} userId - The user's database ObjectId or string.
   * @returns {Promise<Object|null>} The user object if found, otherwise null.
   */
  async getUserById(userId) {
    return await this.collection.findOne({ _id: toObjectId(userId) });
  }
}

module.exports = {
    googleSignInService
};