export function monitoringMiddleware(req, res, next) {
  const startTime = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationMs = seconds * 1000 + nanoseconds / 1e6;

    console.log(
      `[monitoring] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs.toFixed(
        2
      )} ms)`
    );
  });

  next();
}
