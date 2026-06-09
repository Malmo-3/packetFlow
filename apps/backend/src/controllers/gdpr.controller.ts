import type { NextFunction, Request, Response } from "express";
import {
  anonymizeExpiredData,
  getRetentionDays,
} from "../services/anonymize.service";

// POST /gdpr/anonymize — run the retention/anonymization job now (admin).
export const runAnonymization = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await anonymizeExpiredData();
    res.status(200).json({
      success: true,
      message: "Anonymization completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /gdpr/retention — show the configured retention window (admin).
export const getRetention = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: { retentionDays: getRetentionDays() },
  });
};
