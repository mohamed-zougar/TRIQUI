function errorHandler(err, _req, res, _next) {
  if (err?.message === "Origin not allowed by CORS policy") {
    return res.status(403).json({ message: "Origin not allowed." });
  }

  console.error("Unhandled error:", err);

  const status = Number.isInteger(err?.status) ? err.status : 500;
  const message = err?.publicMessage || "An unexpected error occurred.";

  res.status(status).json({ message });
}

module.exports = errorHandler;
