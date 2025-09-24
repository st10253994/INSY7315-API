const { client } = require('../database/db');
const { ObjectId } = require('mongodb'); 

/**
 * Converts a value to a MongoDB ObjectId if valid.
 * @param {string|ObjectId} id - The id to convert.
 * @returns {ObjectId}
 * @throws {Error} If the id is not a valid ObjectId.
 */
function toObjectId(id) {
  if (id instanceof ObjectId) return id; // already valid
  if (typeof id === "string") return new ObjectId(id); 
  throw new Error("Invalid id format");
}

/**
 * Retrieves a user profile by user ID.
 * @param {string|ObjectId} id - The user's id.
 * @returns {Promise<object>} The user profile document.
 * @throws {Error} If the user is not found.
 */
async function getProfileById(id) {
  console.log(`[getProfileById] Entry: userId="${id}"`);
  const db = client.db('RentWise');
  const userSettings = db.collection('User-Settings');

  const user = await userSettings.findOne({ userId: toObjectId(id) });
  if (!user) {
    console.error(`[getProfileById] Error: User not found for userId="${id}"`);
    throw new Error("User not found");
  }

  console.log(`[getProfileById] Exit: Profile found for userId="${id}"`);
  return user;
}

/**
 * Creates or updates a user profile.
 * Performs a partial merge with existing profile data and handles boolean fields.
 * @param {string|ObjectId} id - The user's id.
 * @param {object} data - Profile fields to update or create.
 * @returns {Promise<object>} Confirmation message and updated profile.
 */
async function postUserProfile(id, data) {
  console.log(`[postUserProfile] Entry: userId="${id}"`);
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

  console.log(`[postUserProfile] Exit: Profile updated for userId="${id}"`);
  return {
    message: "Profile Updated Successfully",
    userId: toObjectId(id),
    profile: newProfile,
    updatedAt
  };
}

module.exports = { getProfileById, postUserProfile };
