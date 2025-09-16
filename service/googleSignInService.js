const { client } = require('../database/db');
const { ObjectId } = require('mongodb');

function toObjectId(id) {
  // If already an ObjectId, return it
  if (id instanceof ObjectId) return id;

  // If it's a string and is valid, convert
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }

  // Otherwise, throw error
  throw new Error("Invalid id format: must be a valid ObjectId string");
}

class AuthService {
  constructor() {
    this.collection = client.db().collection('System-Users');
  }

  // Find user by Google ID
  async findUserByGoogleId(googleId) {
    return await this.collection.findOne({ googleId });
  }

  // Create a new user
  async createUser(userData) {
    const user = {
      ...userData,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    const result = await this.collection.insertOne(user);
    return { _id: result.insertedId, ...user };
  }

  // Update "last login"
  async updateLastLogin(userId) {
    await this.collection.updateOne(
      { _id: toObjectId(userId) },
      { $set: { lastLogin: new Date() } }
    );
  }

  // Get user by ID
  async getUserById(id) {
    return await this.collection.findOne({ _id: toObjectId(id) });
  }
}

module.exports = new AuthService();