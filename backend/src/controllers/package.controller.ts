//* Contains the logic for creating and fetching packages.

import { Request, Response } from "express";
import Package from "../models/package.model";  
import mongoose from "mongoose";

export const createPackage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const newPackage = await Package.create(req.body); // new package .. this uses the mongoose model.

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: newPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create package",
      error,
    });
  }
};

export const getAllPackages = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const packages = await Package.find(); // fetch all package documents from the packages collection

    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
      error,
    });
  }
};

// -----------------------------------------
// -----------------------------------------
// getPackageById controller

export const getPackageById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params; // takes the id value from URL parameters ..

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
      return;
    }

    const singlePackage = await Package.findById(id); // look in the package collection, find one document by its MongoDB _id ..

    if (!singlePackage) {
      res.status(404).json({
        success: false,
        message: "Package not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: singlePackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch package",
      error,
    });
  }
};

// -----------------------------------------
// -----------------------------------------
// Patch
// mongoose update helper
// find package by id, update it with value from req.body

export const updatePackageById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
      return;
    }

    const updatedPackage = await Package.findByIdAndUpdate(id, req.body, {
      new: true, // without this mongoose will return the old document update.. with new: true it returns the update document..
      runValidators: true, // when updating, still validate the data against the schema... WITHOUT this updates can sometimes bypass some schema validation behaviour.
    });

    if (!updatedPackage) {
      res.status(404).json({
        success: false,
        message: "Package not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update package",
      error,
    });
  }
};

// -----------------------------------------
// -----------------------------------------
// deletePackagebyid
//

export const deletePackageById = async (
  req: Request<{ id: string }>, // request object (incoming data from client)
  res: Response, // response object (what you send back)
): Promise<void> => {
  try {
    const { id } = req.params; // take the id from the URL .. 

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        messsage: "Invalid package ID",
      });
      return;
    }

    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      res.status(404).json({
        success: false,
        message: "Package not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Package deleted successfully",
      data: deletedPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete package",
      error,
    });
  }
};
