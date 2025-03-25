import { RequestHandler } from "express";
import { Router } from "./common";

const rootHandler: RequestHandler & { description?: string } = async (req, res) => {
  res.status(200).json({ message: "OK" });
};

rootHandler.description = "Returns 'OK' message if the rquest is authorized.";

export const rootRouter: Router = {
  method: "GET",
  route: "/",
  handlers: [rootHandler],
};
