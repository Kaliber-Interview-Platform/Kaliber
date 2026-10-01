import Notification from "../models/Notification.js";

export const createNotification = async (userId, message, type = "system", sentBy = null) => {
  await Notification.create({ user: userId, message, type, sentBy });
};

// ADMIN writes a manual message to one candidate ("interview at 2pm tomorrow")
export const sendAdminMessage = async (req, res) => {
  try {
    const { candidateId, message } = req.body;

    await createNotification(candidateId, message, "admin_message", req.user.id);

    res.status(201).json({ message: "Message sent to candidate" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

// Either role fetches their own notification list (newest first)
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// mark one notification as read (e.g. when candidate clicks/opens it)
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ notification });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification", error: error.message });
  }
};