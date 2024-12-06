import { RequestHandler } from "express";
import { database, isString } from "server";

export const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const api_key = authHeader.split("Bearer ")[1];
    if (api_key) {
      const users = database.getUser({ api_key });
      if (users.length === 1) {
        req.user = users[0];
        next();
        return;
      }
    }
  }

  const apiKeyParam = req.query["api_key"];
  if (isString(apiKeyParam)) {
    const users = database.getUser({ api_key: apiKeyParam });
    if (users.length === 1) {
      req.user = users[0];
      next();
      return;
    }
  }

  res.status(401).json({ message: "Unauthorized: Invalid API key" });
  return;
};
