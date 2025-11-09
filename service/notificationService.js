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
 * Retrieves all notifications from the database.
 * @returns {Promise<Array>} Array of notification documents.
 * @throws {Error} If no notifications are found.
 */
async function getAllNotifications(userId) {
    console.log(`[getAllNotifications] Entry`);
    const db = client.db('RentWise');
    const notifications = db.collection('System-Notifications');
    const notification = await notifications.find({ userId: toObjectId(userId) }).toArray();
    if (!notification) {
        console.error(`[getAllNotifications] Error: Notifications not found`);
        throw new Error("Notifications not found");
    }
    console.log(`[getAllNotifications] Exit: Found ${notification.length} notifications`);
    return notification;
}

/**
 * Creates a new notification with the provided title and message.
 * Marks the notification as unread and sets the creation time.
 * @param {object} data - Notification details (title, notificationMessage).
 * @returns {Promise<object>} The created notification document.
 * @throws {Error} If required fields are missing or insertion fails.
 */
async function createNotification(userId, title, message) {
    console.log(`[createNotification] Entry: title="${title}"`);
    const db = client.db('RentWise');
    const notifications = db.collection('System-Notifications');
    if (!title || !message) {
        console.error(`[createNotification] Error: Missing required fields`);
        throw new Error("Missing required fields");
    }
    const newNotification = {
        userId: toObjectId(userId),
        title,
        message,
        time: new Date().toISOString()
    };
    const result = await notifications.insertOne(newNotification);

    const notificationId = result.insertedId;

    if (!result.acknowledged) {
        console.error(`[createNotification] Error: Failed to add notification`);
        throw new Error("Failed to add notification");
    }

    console.log(`[createNotification] Exit: Notification inserted with id="${notificationId}"`);
    return {
        _id: notificationId,
        title: newNotification.title,
        message: newNotification.message,
        createdAt: newNotification.time,
        message: "Notification inserted Successfully"
    }
}

module.exports = {
    getAllNotifications,
    createNotification
};