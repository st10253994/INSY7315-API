const notification = require('../service/notificationService');

/**
 * Retrieves all notifications from the database.
 * Returns the notifications as a JSON response.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.getAllNotifications = async (req, res) => {
    console.log(`[getAllNotifications] Entry`);
    try {
        const notifications = await notification.getAllNotifications();
        console.log(`[getAllNotifications] Exit: Found ${notifications.length} notifications`);
        res.status(200).json(notifications);
    } catch (error) {
        console.error(`[getAllNotifications] Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Creates a new notification with the provided details in the request body.
 * Returns the created notification as a JSON response.
 * @param {import('express').Request} req - Express request object, expects notification data in body.
 * @param {import('express').Response} res - Express response object.
 */
exports.createNotification = async (req, res) => {
    console.log(`[createNotification] Entry: title="${req.body?.title}"`);
    try {
        const newNotification = await notification.createNotification(req.body);
        console.log(`[createNotification] Exit: Notification created with id="${newNotification?._id}"`);
        res.status(201).json(newNotification);
    } catch (error) {
        console.error(`[createNotification] Error: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
};