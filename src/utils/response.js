//this will be a function that will take the status code, message, and data and will return an object that can be returned as response from server.

export const getSuccessResponse = (statusCode, message, data) => {
  return {
    code: statusCode,
    message,
    data,
  };
};

export const getErrorResponse = (statusCode, errorMessage = "An internal server error occurred.") => {
  return {
    code: statusCode,
    error: errorMessage,
  };
};
