import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { parse } from "csv-parse/sync";
import Package from "../models/package.model";
import BadRequestError from "../errors/BadRequestError";
import {
  importPackagesJsonSchema,
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

type ImportFailure = {
  index: number;
  input: PackageImportItemInput;
  message: string;
};

type CsvImportFailure = {
  rowNumber: number;
  input: Record<string, string | undefined>;
  message: string;
};

export const importPackagesFromJson = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validatedBody = req.validatedBody as ImportPackagesJsonInput;

    const createdPackages = [];
    const failedPackages: ImportFailure[] = [];

    for (let index = 0; index < validatedBody.packages.length; index += 1) {
      const packageItem = validatedBody.packages[index];

      try {
        const createdPackage = await Package.create({
          ...packageItem,
          trackingNumber: generateTrackingNumber(),
          status: packageItem.status || "registered",
        });

        createdPackages.push(createdPackage);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to import package";

        failedPackages.push({
          index,
          input: packageItem,
          message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Package JSON import completed",
      data: {
        totalReceived: validatedBody.packages.length,
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
  pickupCity?: string;
  destinationCity?: string;
  deliveryAddress?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  status?: string;
};

const parseNumberField = (value?: string): number | undefined => {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

export const importPackagesFromCsv = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      next(new BadRequestError("CSV file is required"));
      return;
    }

    const csvContent = req.file.buffer.toString("utf-8");

    let rows: CsvPackageRow[];

    try {
      rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvPackageRow[];
    } catch {
      next(new BadRequestError("Invalid CSV file"));
      return;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      next(new BadRequestError("CSV file is empty"));
      return;
    }

    const createdPackages = [];
    const failedPackages: CsvImportFailure[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];

      const candidate = {
        senderName: row.senderName,
        recipientName: row.recipientName,
        pickupCity: row.pickupCity,
        destinationCity: row.destinationCity,
        deliveryAddress: row.deliveryAddress,
        weight: parseNumberField(row.weight),
        dimensions: {
          length: parseNumberField(row.length),
          width: parseNumberField(row.width),
          height: parseNumberField(row.height),
        },
        ...(row.status ? { status: row.status } : {}),
      };

      const validationResult = packageImportItemSchema.safeParse(candidate);

      if (!validationResult.success) {
        failedPackages.push({
          rowNumber: index + 2,
          input: row,
          message: validationResult.error.issues
            .map((issue) => issue.message)
            .join(", "),
        });
        continue;
      }

      try {
        const createdPackage = await Package.create({
          ...validationResult.data,
          trackingNumber: generateTrackingNumber(),
          status: validationResult.data.status || "registered",
        });

        createdPackages.push(createdPackage);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to import package";

        failedPackages.push({
          rowNumber: index + 2,
          input: row,
          message,
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
