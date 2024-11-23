import { RequestHandler } from "express";

const { API_KEY } = process.env;

export const authenticate: RequestHandler = (req, res, next) => {
  const apiKey = req.headers["authorization"];
  if (apiKey === `Bearer ${API_KEY}`) next();
  else res.status(401).json({ message: "Unauthorized: Invalid API key" });
};
