import { RequestHandler } from "express";

const { API_KEY } = process.env;

export const authenticate: RequestHandler = (req, res, next) => {
  if (API_KEY === undefined) {
    next();
    return;
  }
  const authHeader = req.headers["authorization"];
  if (authHeader === `Bearer ${API_KEY}`) {
    next();
    return;
  }

  const apiKeyParam = req.query["api_key"];
  if (apiKeyParam === API_KEY) {
    next();
    return;
  }

  res.status(401).json({ message: "Unauthorized: Invalid API key" });
  return;
};
