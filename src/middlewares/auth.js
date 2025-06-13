import status from "http-status";
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    const response = {
      status: status.UNAUTHORIZED,
      error: "No token, authorization denied",
    };
    return res.status(status.UNAUTHORIZED).json(response);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(status.UNAUTHORIZED).json({
        status: status.UNAUTHORIZED,
        error: "Session expired, please log in again",
      });
    }
    res
      .status(status.UNAUTHORIZED)
      .json({ status: status.UNAUTHORIZED, error: "Invalid Token!" });
  }
};
