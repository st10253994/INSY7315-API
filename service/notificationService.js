const { client } = require('../database/db');

/**
 * Retrieves all notifications from the database.
 * @returns {Promise<Array>} Array of notification documents.
 * @throws {Error} If no notifications are found.
 */
async function getAllNotifications() {
    console.log(`[getAllNotifications] Entry`);
    const db = client.db('RentWise');
    const notifications = db.collection('System-Notifications');
    const notification = await notifications.find({}).toArray();
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
async function createNotification(data) {
    console.log(`[createNotification] Entry: title="${data?.title}"`);
    const db = client.db('RentWise');
    const notifications = db.collection('System-Notifications');
    const { title, notificationMessage } = data;
    if (!title || !notificationMessage) {
        console.error(`[createNotification] Error: Missing required fields`);
        throw new Error("Missing required fields");
    }
    const newNotification = {
        title,
        notificationMessage,
        read: false,
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
        notificationMessage: newNotification.notificationMessage, 
        isRead: newNotification.read,
        createdAt: newNotification.time,
        message: "Notification inserted Successfully"
    }
}

module.exports = {
    getAllNotifications,
    createNotification
};