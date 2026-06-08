import type { NextFunction, Request, Response } from "express";
import Webhook from "../models/webhook.model";
import NotFoundError from "../errors/NotFoundError";
import type {
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookIdParams,
} from "../schemas/webhook.schemas";

// creates webhooks registration
export const createWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedBody = req.validatedBody as CreateWebhookInput;

    const webhook = await Webhook.create({
      ...validatedBody,
      isActive: validatedBody.isActive ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Webhook created successfully",
      data: webhook,
    });
  } catch (error) {
    next(error);
  }
};

// simple list endpoint
export const getAllWebhooks = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const webhooks = await Webhook.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: webhooks.length,
      data: webhooks,
    });
  } catch (error) {
    next(error);
  }
};

// gets one webhook by id 
export const getWebhookById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as WebhookIdParams;

    const webhook = await Webhook.findById(id);

    if (!webhook) {
      next(new NotFoundError("Webhook not found"));
      return;
    }

    res.status(200).json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    next(error);
  }
};

// allow partial updates.. 
export const updateWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.validatedParams as WebhookIdParams;
    const validatedBody = req.validatedBody as UpdateWebhookInput;

    const updatedWebhook = await Webhook.findByIdAndUpdate(id, validatedBody, {
      new: true,
      runValidators: true,
    });

    if (!updatedWebhook) {
      next(new NotFoundError("Webhook not found"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Webhook updated successfully",
      data: updatedWebhook,
    });
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

    const deletedWebhook = await Webhook.findByIdAndDelete(id);

    if (!deletedWebhook) {
      next(new NotFoundError("Webhook not found"));
      return;
    }

    res.status(200).json({
      success: true,
      message: "Webhook deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};