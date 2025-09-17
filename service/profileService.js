const { client } = require('../database/db');
const { ObjectId } = require('mongodb'); 

function toObjectId(id) {
  if (id instanceof ObjectId) return id; // already valid
  if (typeof id === "string") return new ObjectId(id); 
  throw new Error("Invalid id format");
}

async function getProfileById(id) {
    const db = client.db('RentWise');
    const userSettings = db.collection('User-Settings');

    const user = await userSettings.findOne({ userId: toObjectId(id) });
    if (!user) throw new Error("User not found");
    return user;
}

async function postUserProfile(id, data) {
    const db = client.db('RentWise');
    const userSettings = db.collection('User-Settings');

    const { username, firstName, surname, email, phone, DoB } = data;

    const newProfile = {
        ...(username ? { username } : {}),
        ...(firstName ? { firstName } : {}),
        ...(surname ? { surname } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(DoB ? { DoB: new Date(DoB) } : {})
    };

    const updatedAt = new Date();

    await userSettings.updateOne(
        { userId: toObjectId(id) },
        { $set: {
            userId: toObjectId(id),
            profile: newProfile,
            updatedAt
        }},
        { upsert: true }
    );

    return {
    userId: toObjectId(id),
    profile: newProfile, 
    updatedAt
    };
}

module.exports = { getProfileById, postUserProfile };
