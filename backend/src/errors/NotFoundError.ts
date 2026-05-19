import AppError from "./AppError";

class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, 404, details);
  }
}

export default NotFoundError;
