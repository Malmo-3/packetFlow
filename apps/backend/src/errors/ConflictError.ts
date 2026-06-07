import AppError from "./AppError";

class ConflictError extends AppError {
  constructor(message = "Conflict", details?: unknown) {
    super(message, 409, details); // shortcut for http 409 conflict, we use 409 when resource already exist, e.x: duplicate email during register.
  }
}

export default ConflictError;
