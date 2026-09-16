export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function notFound(req, res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.path} not found`));
}

export function errorHandler(err, req, res, next) {
  if (err?.code === 11000) {
    return res.status(409).json({ error: { message: "Duplicate value already exists" } });
  }

  const status = err.status || (err?.name === "ValidationError" || err?.name === "CastError" ? 400 : 500);
  res.status(status).json({
    error: {
      message: status === 500 ? "Internal server error" : err.message,
      ...(err.details ? { details: err.details } : {})
    }
  });
}
