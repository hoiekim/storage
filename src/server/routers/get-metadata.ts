import { RequestHandler } from "express";
import { database } from "server";
import { Router } from "./common";

const metadataHandler: RequestHandler & { description?: string } = async (req, res) => {
  const { id: idString } = req.params;
  const id = +idString;
  const user = req.user!;

  if (Number.isNaN(id)) {
    try {
      const metadata = database.getMetadata({ user_id: user.id });
      res.status(200).json({ body: metadata });
    } catch (err: any) {
      const message = "message" in err ? err.message : "Unknown error";
      res.status(404).json({ message: `Metadata not found: ${message}` });
    }
  } else {
    try {
      const metadata = database.getMetadata({ id, user_id: user.id });
      res.status(200).json({ body: metadata });
    } catch (err: any) {
      const message = "message" in err ? err.message : "Unknown error";
      res.status(404).json({ message: `Metadata not found: ${message}` });
    }
  }
};

metadataHandler.description =
  "Returns metadata found by 'id'. Returns all metadata items if called without 'id'.";

export const metadataRouter: Router = {
  method: "GET",
  route: "/metadata/:id",
  handlers: [metadataHandler],
};

export const allMetadataRouter: Router = {
  method: "GET",
  route: "/metadata",
  handlers: [metadataHandler],
};
