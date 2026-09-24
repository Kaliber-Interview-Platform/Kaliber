const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
 
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
 
  res.status(statusCode).json({
    message: err.message || "Server error",
    // only show the stack trace in development, never in production
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
};
 
export default errorHandler;
 