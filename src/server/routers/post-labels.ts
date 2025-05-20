import { RequestHandler } from "express";
import { database, isString } from "server";
import { Router } from "./common";

const postLabelsHandler: RequestHandler & { description?: string } = async (req, res) => {
  const user = req.user!;
  const user_id = user.id;
  const item_id = req.params["item_id"];
  const labels = req.body;

  if (!item_id) {
    res.status(400).json({ message: "Invalid request: item_id is required" });
    return;
  }

  if (!Array.isArray(labels) || !labels.every(isString)) {
    res
      .status(400)
      .json({ message: "Invalid request: request body is required as an array of strings" });
    return;
  }

  try {
    const metadata = database.getMetadata({ user_id, item_id })[0];
    if (!metadata) {
      console.log("metadata not found for item_id", item_id);
      res.status(404).json({ message: "Metadata not found" });
      return;
    }
    database.removeLabels(metadata.id, user_id);
    database.insertLabels(metadata.id, user_id, labels);
    res.status(204).end();
    return;
  } catch (err: any) {
    const message = "message" in err ? err.message : "Unknown error";
    res.status(404).json({ message: `Labels not found: ${message}` });
  }
};

export const postLabelsRouter: Router = {
  method: "POST",
  route: "/labels/:item_id",
  handlers: [postLabelsHandler],
};
