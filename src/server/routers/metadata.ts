import { RequestHandler } from "express";
import { database } from "server";
import { Router } from "./common";

const METADATA_ROUTE = "/metadata";

const metadataHandler: RequestHandler = async (req, res) => {
  try {
    const metadata = database.getAll();
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

const METADATA_BY_ID_ROUTE = "/metadata-by-id/:id";

const metadataByIdHandler: RequestHandler = async (req, res) => {
  const { id: idString } = req.params;
  const id = +idString;
  if (Number.isNaN(id)) {
    res.status(404).json({ message: `Invalid parameter: ${idString}` });
  }
  try {
    const metadata = database.get({ id });
    res.status(200).json({ body: metadata });
  } catch (err: any) {
    const message = "message" in err ? err.message : "Unknown error";
    res.status(404).json({ message: `Metadata not found: ${message}` });
  }
};

export const metadataByIdRouter: Router = {
  routeName: METADATA_BY_ID_ROUTE,
  routeHandlers: [metadataByIdHandler],
};
