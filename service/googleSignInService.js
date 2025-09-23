const { client } = require('../database/db');
const profile = require('./profileService');
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
    this.collections = db.collection('User-Settings')
  }

  //Find user by Google ID
  async findUserByGoogleId(googleId) {
    return await this.collection.findOne({ googleId });
  }

  //Create a new user
  async createUser(userData, profileData) {
    const user = {
      ...userData,
      createdAt: new Date(),
    };
    const profile = {
      ...profileData
    }
    const result = await this.collection.insertOne(user);
    const userID = result.insertedId;
    const insert = await profile.postUserProfile(userID, profile);
    return { _id: result.insertedId,_id: insert.insertedId, ...user };
  }


  //Get user by DB ID
  async getUserById(userId) {
    return await this.collection.findOne({ _id: toObjectId(userId) });
  }
}

module.exports = {
    googleSignInService
};