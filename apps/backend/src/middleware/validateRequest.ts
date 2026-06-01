import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import BadRequestError from "../errors/BadRequestError";

type ValidationSchemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};
 
const validateRequest =
  ({ body, params, query }: ValidationSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (body) {
      const result = body.safeParse(req.body); // safeparse does not throww, it gives a result object!! succes ture, or success false.

      if (!result.success) {
        next(
          new BadRequestError( 
            "Request body validation failed",
            result.error.flatten(),
          ),
        );
        return;
      }

      req.validatedBody = result.data;
    }

    if (params) {
      const result = params.safeParse(req.params);

      if (!result.success) {
        next(
          new BadRequestError(
            "Request params validation failed",
            result.error.flatten(),
          ),
        );
        return;
      }

      req.validatedParams = result.data;
    }

    if (query) {
      const result = query.safeParse(req.query);

      if (!result.success) {
        next(
          new BadRequestError(
            "Request query validation failed",
            result.error.flatten(),
          ),
        );
        return;
      }

      req.validatedQuery = result.data;
    }

    next();
  };

export default validateRequest;
