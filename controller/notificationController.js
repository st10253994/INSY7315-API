const notification = require('../service/notificationService');

exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await notification.getAllNotifications();
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createNotification = async (req, res) => {
    try {
        const newNotification = await notification.createNotification(req.body);
        res.status(201).json(newNotification);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};