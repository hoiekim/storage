import { RequestHandler } from "express";
import { database, Metadata } from "server";
import { Router } from "./common";

const METADATA_ROUTE = "/metadata/:id";

const metadataHandler: RequestHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const metadata = database.get({ id });
    res.status(200).json({ body: metadata });
  } catch (err: any) {
    const message = "message" in err ? err.message : "Unknown error";
    res.status(404).json({ message: `Metadata not found: ${message}` });
  }
};

export const metadataRouter: Router = {
  routeName: METADATA_ROUTE,
  routeHandlers: [metadataHandler],
};
