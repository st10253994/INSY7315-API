let notification = [];

//get all notifications
function getAllNotifications() {
    return notification;
}

//create a new notification
function createNotification(data) {
    const { title, message} = data;
    if (!title || !message) {
        throw new Error("Missing required fields");
    }
    const newNotification = {
        id: notification.length + 1,
        title,
        message,
        read: false,
        time: new Date()
    };
    notification.push(newNotification);
    return newNotification;
}

module.exports = {
    getAllNotifications,
    createNotification
};