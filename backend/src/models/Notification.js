import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },

  type: { type: String, enum: ["system", "admin_message"], default: "system" },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;