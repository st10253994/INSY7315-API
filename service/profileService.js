const { client } = require('../database/db');
const { ObjectId } = require('mongodb'); 

function toObjectId(id) {
  if (id instanceof ObjectId) return id; // already valid
  if (typeof id === "string") return new ObjectId(id); 
  throw new Error("Invalid id format");
}

// Get user profile by userId
async function getProfileById(id) {
  const db = client.db('RentWise');
  const userSettings = db.collection('User-Settings');

  const user = await userSettings.findOne({ userId: toObjectId(id) });
  if (!user) throw new Error("User not found");

  return user;
}

// Create or update profile (partial merge)
async function postUserProfile(id, data) {
  const db = client.db('RentWise');
  const userSettings = db.collection('User-Settings');

  // Fetch existing document
  const existingDoc = await userSettings.findOne({ userId: toObjectId(id) });

  // Existing profile or empty
  const existingProfile = existingDoc?.profile || {};

  const booleanFields = ["notifications", "offlineSync"];
  booleanFields.forEach(field => {
    if (data[field] !== undefined) {
      data[field] = data[field] === "true"; // convert string to boolean
    } else if (existingProfile[field] === undefined) {
      data[field] = false; // default false if not sent and not in existing profile
    }
  });

  // Merge: user-provided fields override existing ones
  const newProfile = {
    ...existingProfile,
    ...data
  };

  const updatedAt = new Date();


  await userSettings.updateOne(
    { userId: toObjectId(id) },
    {
      $set: {
        userId: toObjectId(id),
        profile: newProfile,
        updatedAt
      }
    },
    { upsert: true }
  );

  return {
    message: "Profile Updated Successfully",
    userId: toObjectId(id),
    profile: newProfile,
    updatedAt
  };
}

module.exports = { getProfileById, postUserProfile };
