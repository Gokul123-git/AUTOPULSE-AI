import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const filter = { recipient: req.user._id };
    const notifications = await Notification.find(filter).sort('-createdAt').limit(50);
    res.status(200).json({ ok: true, count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true }, { new: true });
    if (!notif) return res.status(404).json({ ok: false, error: 'Notification not found' });
    res.status(200).json({ ok: true, notification: notif });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const n = await Notification.create({ ...req.body, recipient: req.user._id });
    res.status(201).json({ ok: true, notification: n });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    if (!n) return res.status(404).json({ ok: false, error: 'Notification not found' });
    res.status(200).json({ ok: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
