//* Carrier flow controllers for assigned trips and package scans.

import { Request, Response } from "express";
import mongoose, { HydratedDocument } from "mongoose";
import { Delivery, IDelivery } from "../models/delivery.model";
import Package, { IPackage } from "../models/package.model";
import ScanRecord from "../models/scanRecord.model";
import Trip, { type ITrip } from "../models/trip.model";

interface TripParams {
  [key: string]: string;
  tripId: string;
}

interface ScanBody {
  packageId?: string;
  scanCode?: string;
}

interface CarrierTripResult {
  carrierId: string;
  trip: HydratedDocument<ITrip>;
}

interface ValidCarrierScan extends CarrierTripResult {
  delivery: HydratedDocument<IDelivery>;
  packageId: string;
  scanCode: string;
  packageDoc: HydratedDocument<IPackage>;
}

const getCarrierId = (req: Request): string | null => {
  const carrierId = req.header("x-carrier-id")?.trim();
  return carrierId || null;
};

const requireCarrierId = (req: Request, res: Response): string | null => {
  const carrierId = getCarrierId(req);

  if (!carrierId) {
    res.status(400).json({
      success: false,
      message: "x-carrier-id header is required",
    });
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(carrierId)) {
    res.status(400).json({
      success: false,
      message: "Invalid carrier ID",
    });
    return null;
  }

  return carrierId;
};

const getCarrierTrip = async (
  req: Request<TripParams>,
  res: Response,
): Promise<CarrierTripResult | null> => {
  const carrierId = requireCarrierId(req, res);
  if (!carrierId) {
    return null;
  }

  const { tripId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    res.status(400).json({
      success: false,
      message: "Invalid trip ID",
    });
    return null;
  }

  const trip = await Trip.findOne({
    _id: tripId,
    assignedCarrier: new mongoose.Types.ObjectId(carrierId),
  });

  if (!trip) {
    res.status(404).json({
      success: false,
      message: "Trip not found for carrier",
    });
    return null;
  }

  return {
    carrierId,
    trip,
  };
};

const getDeliveriesForTrip = async (
  tripId: string,
): Promise<HydratedDocument<IDelivery>[]> => {
  return Delivery.find({
    trip: tripId,
  });
};

const getPackagesByDelivery = async (
  deliveries: HydratedDocument<IDelivery>[],
): Promise<Map<string, HydratedDocument<IPackage>>> => {
  const packageIds = deliveries.map((delivery) => delivery.package);
  const packages = await Package.find({
    _id: {
      $in: packageIds,
    },
  });

  return new Map(
    packages.map((packageDoc) => [packageDoc.id, packageDoc]),
  );
};

const countRemainingDeliveries = async (tripId: string): Promise<number> => {
  const deliveries = await getDeliveriesForTrip(tripId);
  const packagesById = await getPackagesByDelivery(deliveries);

  return deliveries.filter((delivery) => {
    const packageDoc = packagesById.get(delivery.package.toString());
    return delivery.status !== "delivered" || packageDoc?.status !== "delivered";
  }).length;
};

const validateCarrierScan = async (
  req: Request<TripParams, unknown, ScanBody>,
  res: Response,
): Promise<ValidCarrierScan | null> => {
  const carrierTrip = await getCarrierTrip(req, res);
  if (!carrierTrip) {
    return null;
  }

  const packageId = req.body.packageId?.trim();
  const scanCode = req.body.scanCode?.trim();

  if (!packageId) {
    res.status(400).json({
      success: false,
      message: "packageId is required",
    });
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(packageId)) {
    res.status(400).json({
      success: false,
      message: "Invalid package ID",
    });
    return null;
  }

  if (!scanCode) {
    res.status(400).json({
      success: false,
      message: "scanCode is required",
    });
    return null;
  }

  const delivery = await Delivery.findOne({
    trip: carrierTrip.trip.id,
    package: packageId,
  });

  if (!delivery) {
    res.status(400).json({
      success: false,
      message: "Package is not assigned to this trip",
    });
    return null;
  }

  const packageDoc = await Package.findById(packageId);

  if (!packageDoc) {
    res.status(404).json({
      success: false,
      message: "Package not found",
    });
    return null;
  }

  if (packageDoc.trackingNumber !== scanCode) {
    res.status(400).json({
      success: false,
      message: "Invalid scan: scanCode does not match package trackingNumber",
    });
    return null;
  }

  return {
    ...carrierTrip,
    delivery,
    packageId,
    scanCode,
    packageDoc,
  };
};

export const getAssignedTrip = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const carrierId = requireCarrierId(req, res);
    if (!carrierId) {
      return;
    }

    const trip = await Trip.findOne({
      assignedCarrier: new mongoose.Types.ObjectId(carrierId),
      status: {
        $in: ["planned", "active"],
      },
    }).sort({
      createdAt: -1,
    });

    if (!trip) {
      res.status(404).json({
        success: false,
        message: "No planned or active trip found for carrier",
      });
      return;
    }

    const deliveries = await Delivery.find({
      trip: trip.id,
    }).populate("package");

    res.status(200).json({
      success: true,
      data: {
        trip,
        deliveries,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned trip",
      error,
    });
  }
};

export const getTripPackages = async (
  req: Request<TripParams>,
  res: Response,
): Promise<void> => {
  try {
    const carrierTrip = await getCarrierTrip(req, res);
    if (!carrierTrip) {
      return;
    }

    const deliveries = await getDeliveriesForTrip(carrierTrip.trip.id);
    const packagesById = await getPackagesByDelivery(deliveries);

    const packages = deliveries
      .map((delivery) => packagesById.get(delivery.package.toString()))
      .filter((packageDoc): packageDoc is HydratedDocument<IPackage> => {
        return Boolean(packageDoc);
      });

    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch trip packages",
      error,
    });
  }
};

export const validatePackageScan = async (
  req: Request<TripParams, unknown, ScanBody>,
  res: Response,
): Promise<void> => {
  try {
    const validScan = await validateCarrierScan(req, res);
    if (!validScan) {
      return;
    }

    res.status(200).json({
      success: true,
      message: "Package scan is valid",
      data: {
        valid: true,
        tripId: validScan.trip.id,
        deliveryId: validScan.delivery.id,
        packageId: validScan.packageId,
        scanCode: validScan.scanCode,
        packageStatus: validScan.packageDoc.status,
        deliveryStatus: validScan.delivery.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to validate package scan",
      error,
    });
  }
};

export const scanPackage = async (
  req: Request<TripParams, unknown, ScanBody>,
  res: Response,
): Promise<void> => {
  try {
    const validScan = await validateCarrierScan(req, res);
    if (!validScan) {
      return;
    }

    if (validScan.trip.status !== "active") {
      res.status(409).json({
        success: false,
        message: "Trip must be checked in before scanning packages",
        tripStatus: validScan.trip.status,
      });
      return;
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      validScan.packageId,
      {
        status: "delivered",
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedPackage) {
      res.status(404).json({
        success: false,
        message: "Package not found",
      });
      return;
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      validScan.delivery.id,
      {
        status: "delivered",
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedDelivery) {
      res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
      return;
    }

    const scannedAt = new Date();
    const scanRecord = await ScanRecord.create({
      carrierId: validScan.carrierId,
      tripId: new mongoose.Types.ObjectId(validScan.trip.id),
      packageId: new mongoose.Types.ObjectId(validScan.packageId),
      scanCode: validScan.scanCode,
      result: "valid",
      packageStatusAfter: "delivered",
      scannedAt,
    });

    const remainingPackages = await countRemainingDeliveries(validScan.trip.id);

    res.status(201).json({
      success: true,
      message: "Package scan recorded successfully",
      data: {
        scanRecord,
        package: updatedPackage,
        delivery: updatedDelivery,
        tripStatus: validScan.trip.status,
        remainingPackages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to scan package",
      error,
    });
  }
};

export const checkIn = async (
  req: Request<TripParams>,
  res: Response,
): Promise<void> => {
  try {
    const carrierTrip = await getCarrierTrip(req, res);
    if (!carrierTrip) {
      return;
    }

    if (carrierTrip.trip.status !== "planned") {
      res.status(409).json({
        success: false,
        message: "Trip can only be checked in when it is planned",
        tripStatus: carrierTrip.trip.status,
      });
      return;
    }

    carrierTrip.trip.status = "active";
    await carrierTrip.trip.save();

    res.status(200).json({
      success: true,
      message: "Checked in successfully",
      data: {
        trip: carrierTrip.trip,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check in",
      error,
    });
  }
};

export const checkOut = async (
  req: Request<TripParams>,
  res: Response,
): Promise<void> => {
  try {
    const carrierTrip = await getCarrierTrip(req, res);
    if (!carrierTrip) {
      return;
    }

    if (carrierTrip.trip.status !== "active") {
      res.status(409).json({
        success: false,
        message: "Trip can only be checked out when it is active",
        tripStatus: carrierTrip.trip.status,
      });
      return;
    }

    const remainingPackages = await countRemainingDeliveries(
      carrierTrip.trip.id,
    );

    if (remainingPackages > 0) {
      res.status(409).json({
        success: false,
        message: "Cannot end shift while deliveries are still unfinished",
        remainingPackages,
      });
      return;
    }

    carrierTrip.trip.status = "completed";
    await carrierTrip.trip.save();

    res.status(200).json({
      success: true,
      message: "Shift ended successfully",
      data: {
        trip: carrierTrip.trip,
        remainingPackages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check out",
      error,
    });
  }
};

export const endShift = checkOut;
