const buckets = new Map();

function rateLimit({ windowMs, max, key } = {}) {
  if (!Number.isInteger(windowMs) || windowMs <= 0) {
    throw new Error("rateLimit: windowMs must be a positive integer.");
  }
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error("rateLimit: max must be a positive integer.");
  }

  const buildKey = typeof key === "function"
    ? key
    : (req) => `${req.ip}:${req.path}`;

  return function rateLimiter(req, res, next) {
    const bucketKey = buildKey(req);
    const now = Date.now();
    const bucket = buckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res
        .status(429)
        .json({ message: "Too many attempts. Please try again later." });
    }

    bucket.count += 1;
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();

module.exports = rateLimit;
