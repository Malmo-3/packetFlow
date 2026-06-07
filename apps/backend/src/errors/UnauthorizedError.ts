import AppError from "./AppError";

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, 401, details); // shortcut for http 401 unauthorized! we use 401 when, logic credential are wrong, request has no valid auth. for login failure its good.
  }
}

export default UnauthorizedError;
