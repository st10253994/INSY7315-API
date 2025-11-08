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
  const existingProfile = await userSettings.findOne({ userId: toObjectId(id) });

  // Prepare updated profile data
  const updatedProfile = { ...existingProfile, ...data, userId: toObjectId(id) };

  // Upsert the profile document
  await userSettings.updateOne(
    { userId: toObjectId(id) },
    { $set: updatedProfile },
    { upsert: true }
  );
  console.log(`[postUserProfile] Exit: Profile upserted for userId="${id}"`);
  return { message: 'Profile updated', profile: updatedProfile };

}

module.exports = { getProfileById, postUserProfile };
