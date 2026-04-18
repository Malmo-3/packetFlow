//? route file = say which endpoints exists.. 
//? Controller file = says what happens when endpoint hitsss.

import { Request, Response } from "express";

export const getTestMessage = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "Backend is working",
  });
};
