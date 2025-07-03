import status from "http-status";
import jwt from "jsonwebtoken";
import { getErrorResponse } from "../utils/response.js";
import validator from "validator";

export const authMiddleware = (req, res, next) => {
  try {
    const { token } = req.cookies;

    if(!token){
      throw new Error("No token, please log in again")
    }
    
    if (!validator.isJWT(token)) {
      throw new Error("Invalid Token!");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      err.message = "Session expired, please log in again";
    }
    res
      .status(status.UNAUTHORIZED)
      .json(getErrorResponse(status.UNAUTHORIZED, err.message));
  }
};
