import express from "express";

export const parseJson = (req, res, next) => {
  const allowedMethods = ["POST", "PUT", "PATCH"];

  if (allowedMethods.includes(req.method)) {
    express.json()(req, res, next);
  } else {
    next();
  }
}