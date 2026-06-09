import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { parse } from "csv-parse/sync";
import Package from "../models/package.model";
import BadRequestError from "../errors/BadRequestError";
import { DROP_OFF_POINTS } from "../shared/skane";
import {
  packageImportItemSchema,
  type ImportPackagesJsonInput,
  type PackageImportItemInput,
} from "../schemas/import.schemas";

const generateTrackingNumber = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = crypto
    .randomBytes(8)
    .reduce((acc, byte) => acc + chars[byte % chars.length], "");
  return `PKT-${random}`;
};

/** Build the persisted package doc from a validated import item (resolves depots + tracking). */
const toPackageDoc = (item: PackageImportItemInput) => ({
  ...item,
  trackingNumber: generateTrackingNumber(),
  dropOffPoint: DROP_OFF_POINTS[item.pickupCity],
  pickUpPoint: DROP_OFF_POINTS[item.destinationCity],
  status: "registered" as const,
});

export const importPackagesFromJson = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.validatedBody as ImportPackagesJsonInput;

    const createdPackages = [];
    const failedPackages: Array<{
      index: number;
      input: PackageImportItemInput;
      message: string;
    }> = [];

    for (let index = 0; index < body.packages.length; index += 1) {
      const item = body.packages[index];
      try {
        createdPackages.push(await Package.create(toPackageDoc(item)));
      } catch (error) {
        failedPackages.push({
          index,
          input: item,
          message: error instanceof Error ? error.message : "Failed to import package",
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Package JSON import completed",
      data: {
        totalReceived: body.packages.length,
        createdCount: createdPackages.length,
        failedCount: failedPackages.length,
        createdPackages,
        failedPackages,
      },
    });
  } catch (error) {
    next(error);
  }
};

type CsvPackageRow = {
  senderName?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  pickupCity?: string;
  destinationCity?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
};

const parseNumberField = (value?: string): number | undefined => {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const importPackagesFromCsv = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) return next(new BadRequestError("CSV file is required"));

    const csvContent = req.file.buffer.toString("utf-8");

    let rows: CsvPackageRow[];
    try {
      rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvPackageRow[];
    } catch {
      return next(new BadRequestError("Invalid CSV file"));
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return next(new BadRequestError("CSV file is empty"));
    }

    const createdPackages = [];
    const failedPackages: Array<{
      rowNumber: number;
      input: CsvPackageRow;
      message: string;
    }> = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];

      const candidate = {
        senderName: row.senderName,
        recipientName: row.recipientName,
        recipientEmail: row.recipientEmail,
        recipientPhone: row.recipientPhone,
        recipientAddress: row.recipientAddress,
        pickupCity: row.pickupCity,
        destinationCity: row.destinationCity,
        weight: parseNumberField(row.weight),
        dimensions: {
          length: parseNumberField(row.length),
          width: parseNumberField(row.width),
          height: parseNumberField(row.height),
        },
      };

      const result = packageImportItemSchema.safeParse(candidate);
      if (!result.success) {
        failedPackages.push({
          rowNumber: index + 2,
          input: row,
          message: result.error.issues.map((i) => i.message).join(", "),
        });
        continue;
      }

      try {
        createdPackages.push(await Package.create(toPackageDoc(result.data)));
      } catch (error) {
        failedPackages.push({
          rowNumber: index + 2,
          input: row,
          message: error instanceof Error ? error.message : "Failed to import package",
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Package CSV import completed",
      data: {
        totalReceived: rows.length,
        createdCount: createdPackages.length,
        failedCount: failedPackages.length,
        createdPackages,
        failedPackages,
      },
    });
  } catch (error) {
    next(error);
  }
};
