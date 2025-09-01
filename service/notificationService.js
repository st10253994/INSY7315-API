const { client } = require('../database/db');

//get all notifications
async function getAllNotifications() {
    const db = client.db('RentWise');
    const notifications = db.collection('System-Notifications');

    const notification = await notifications.find({}).toArray()
    if (!notification) throw new Error("Notifications not found");
    return notification;
}

//create a new notification
async function createNotification(data) {
    const db = client.db('RentWise');
    const notifications = db.collection('System-Notifications');
    const { title, message } = data;
    if (!title || !message) {
        throw new Error("Missing required fields");
    }
    const newNotification = {
        title,
        message,
        read: false,
        time: new Date()
    };
    const result = await notifications.insertOne(newNotification)

    const notificationId = result.insertedId;

    if (!result.acknowledged) {
        throw new Error("Failed to add notification");
    }

    return {
        _id: notificationId,
        title: newNotification.title,
        message: newNotification.message, 
        isRead: newNotification.read,
        createdAt: newNotification.time,
        message: "Notification inserted Successfully"
    }
}

module.exports = {
    getAllNotifications,
    createNotification
};