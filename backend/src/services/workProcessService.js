import { WorkProcess } from "../models/index.js";

export async function logWorkProcess({
  user,
  action,
  title,
  detail = "",
  category = "general",
  status = "completed",
  metadata = {},
}) {
  try {
    if (!user) return null;
    const userId = user._id || user;
    return await WorkProcess.create({
      user: userId,
      action,
      title,
      detail,
      category,
      status,
      metadata,
    });
  } catch (err) {
    console.error("Failed to log work process:", err.message);
    return null;
  }
}

export async function getWorkProcessHistory(userId, limit = 50) {
  return await WorkProcess.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
