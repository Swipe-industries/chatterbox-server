import jwt from "jsonwebtoken";

const getJWT = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || "2h",
  });
};

export default getJWT;
