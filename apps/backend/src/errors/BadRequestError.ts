import AppError from "./AppError";

class BadRequestError extends AppError {
  constructor(message = "Bad requestt", details?: unknown) {
    super(message, 400, details);
  }
}

export default BadRequestError;
