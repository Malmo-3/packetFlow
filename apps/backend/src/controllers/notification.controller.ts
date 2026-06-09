/**
 * Notification controller.
 *
 * The list endpoint returns the WRAPPED shape { success, data, unreadCount }
 * to match @packetflow/backend-client → notifications.ts. All routes are scoped to
 * the calling user — a user can only see and mutate their own notifications.
 */

import type { NextFunction, Request, Response } from "express";
import { Notification } from "../models/notification.model";
import NotFoundError from "../errors/NotFoundError";
import type { NotificationIdParams } from "../schemas/notification.schemas";

// GET /notifications
export const getMyNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const notifications = await Notification.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user!.userId,
      read: false,
    });

    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// PATCH /notifications/:id/read
export const markOneRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as NotificationIdParams;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user!.userId },
      { read: true },
      { new: true },
    );

    if (!notification) return next(new NotFoundError("Notification not found"));
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// PATCH /notifications/read-all
export const markAllRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await Notification.updateMany(
      { userId: req.user!.userId, read: false },
      { read: true },
    );
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

// DELETE /notifications/:id
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as NotificationIdParams;

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user!.userId,
    });

    if (!deleted) return next(new NotFoundError("Notification not found"));
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
};

// DELETE /notifications  — clears all of the calling user's notifications
export const deleteAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await Notification.deleteMany({ userId: req.user!.userId });
    res.status(200).json({
      success: true,
      message: "All notifications deleted",
      deletedCount: result.deletedCount ?? 0,
    });
  } catch (error) {
    next(error);
  }
};
