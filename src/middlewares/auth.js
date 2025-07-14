import status from "http-status";
import jwt from "jsonwebtoken";
import { getErrorResponse } from "../utils/response.js";
import validator from "validator";
import cookie from "cookie";

export const authMiddleware = (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      throw new Error("Session expired, please log in again");
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

export const socketAuth = (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      return next(new Error("No cookies sent, please log in again"));
    }

    const cookies = cookie.parse(cookieHeader);
    
    const token = cookies.token;

    if (!token) {
      return next(new Error("No token in cookies, please log in again"));
    }

    if (!validator.isJWT(token)) {
      return next(new Error("Invalid token!"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.userId;

    next();
  } catch (err) {
    return next(new Error(err.message));
  }
};
