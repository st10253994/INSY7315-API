const { client } = require('../database/db');
const profileService = require('./profileService');
const { ObjectId } = require('mongodb');

function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  throw new Error("Invalid ID format");
}

class googleSignInService {
  constructor() {
    const db = client.db('RentWise');
    this.collection = db.collection('System-Users');
  }

  //Find user by Google ID
  async findUserByGoogleId(googleId) {
    return await this.collection.findOne({ googleId });
  }

  //Create a new user
  async createUser(userData) {
    const user = {
      ...userData,
      createdAt: new Date(),
    };

    const parts = userData.name.split(' ')

    const profile = {
      firstName: parts[0],
      surname: parts[1],
      email: userData.email,
      pfpImage: userData.photo
    }

    const result = await this.collection.insertOne(user);
    const userId = result.insertedId;
    await profileService.postUserProfile(userId, profile);
    return { _id: result.insertedId, ...user };
  }


  //Get user by DB ID
  async getUserById(userId) {
    return await this.collection.findOne({ _id: toObjectId(userId) });
  }
}

module.exports = {
    googleSignInService
};