import type { NextFunction, Request, Response } from "express";
import Webhook from "../models/webhook.model";
import WebhookLog from "../models/webhookLog.model";
import NotFoundError from "../errors/NotFoundError";
import type {
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookIdParams,
} from "../schemas/webhook.schemas";

export const createWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.validatedBody as CreateWebhookInput;
    const webhook = await Webhook.create({ ...body, active: body.active ?? true });
    res.status(201).json({ success: true, message: "Webhook created successfully", data: webhook });
  } catch (error) {
    next(error);
  }
};

export const getAllWebhooks = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const webhooks = await Webhook.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: webhooks.length, data: webhooks });
  } catch (error) {
    next(error);
  }
};

// GET /webhooks/logs — recent delivery attempts (newest first). Registered before "/:id".
export const getWebhookLogs = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const logs = await WebhookLog.find()
      .populate("webhook")
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

export const getWebhookById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as WebhookIdParams;
    const webhook = await Webhook.findById(id);
    if (!webhook) return next(new NotFoundError("Webhook not found"));
    res.status(200).json({ success: true, data: webhook });
  } catch (error) {
    next(error);
  }
};

export const updateWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as WebhookIdParams;
    const body = req.validatedBody as UpdateWebhookInput;
    const updated = await Webhook.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return next(new NotFoundError("Webhook not found"));
    res.status(200).json({ success: true, message: "Webhook updated successfully", data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as WebhookIdParams;
    const deleted = await Webhook.findByIdAndDelete(id);
    if (!deleted) return next(new NotFoundError("Webhook not found"));
    res.status(200).json({ success: true, message: "Webhook deleted successfully" });
  } catch (error) {
    next(error);
  }
};
