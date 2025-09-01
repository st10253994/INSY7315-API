const notification = require('../service/notificationService');

exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = notification.getAllNotifications();
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createNotification = async (req, res) => {
    try {
        const newNotification = notification.createNotification(req.body);
        res.status(201).json(newNotification);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};