import { RequestHandler } from "express";
import { database } from "server";
import { Router } from "./common";

const getLabelsHandler: RequestHandler & { description?: string } = async (req, res) => {
  const user = req.user!;
  const user_id = user.id;
  const metadataIdString = req.params["metadata_id"];

  if (!metadataIdString) {
    res.status(400).json({ message: "Invalid request: metadata_id is required" });
    return;
  }

  try {
    const metadata_id = parseInt(metadataIdString);
    const labelsFoundById = database.getLabels(user_id, metadata_id);
    if (labelsFoundById.length) {
      res.status(200).json({ body: labelsFoundById });
      return;
    }
    res.status(204).end();
  } catch (err: any) {
    const message = "message" in err ? err.message : "Unknown error";
    res.status(404).json({ message: `Labels not found: ${message}` });
  }
};

export const getLabelsRouter: Router = {
  method: "GET",
  route: "/labels/:metadata_id",
  handlers: [getLabelsHandler],
};
