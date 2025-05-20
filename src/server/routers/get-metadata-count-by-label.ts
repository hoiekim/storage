import { RequestHandler } from "express";
import { database } from "server";
import { Router } from "./common";

const getMetadataCountByLabelHandler: RequestHandler & { description?: string } = async (
  req,
  res
) => {
  const user = req.user!;
  const user_id = user.id;

  try {
    const labelsFoundById = database.getMetadataCountByLabel(user_id);
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

export const getMetadataCountByLabelRouter: Router = {
  method: "GET",
  route: "/metadata-count-by-label",
  handlers: [getMetadataCountByLabelHandler],
};
