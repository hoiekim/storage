import { RequestHandler } from "express";
import { database } from "server";
import { Router } from "./common";

const metadataHandler: RequestHandler = async (req, res) => {
  const { id: idString } = req.params;
  const id = +idString;
  if (Number.isNaN(id)) {
    try {
      const metadata = database.getAllMetadata();
      res.status(200).json({ body: metadata });
    } catch (err: any) {
      const message = "message" in err ? err.message : "Unknown error";
      res.status(404).json({ message: `Metadata not found: ${message}` });
    }
  } else {
    try {
      const metadata = database.getMetadata({ id });
      res.status(200).json({ body: metadata });
    } catch (err: any) {
      const message = "message" in err ? err.message : "Unknown error";
      res.status(404).json({ message: `Metadata not found: ${message}` });
    }
  }
};

export const metadataRouter: Router = {
  route: "/metadata/:id",
  handlers: [metadataHandler],
};

export const allMetadataRouter: Router = {
  route: "/metadata",
  handlers: [metadataHandler],
};
