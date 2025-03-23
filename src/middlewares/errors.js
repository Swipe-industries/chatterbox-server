export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).json({ 
    message: err.message || "Something went wrong" 
  });
};