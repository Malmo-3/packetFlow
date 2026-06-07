//? this runs when no route matches..

import { Request, Response } from "express";

const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

export default notFound;
