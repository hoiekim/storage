import fs from "fs";
import path from "path";
import { RequestHandler } from "express";
import { database } from "server";
import { FILES_DIR, Router, THUMBNAILS_DIR } from "./common";

const deleteHandler: RequestHandler = async (req, res) => {
  const { id: idString } = req.params;
  const id = +idString;
  const user = req.user!;

  if (Number.isNaN(id)) {
    res.status(404).json({ message: `Invalid parameter: ${id}` });
  } else {
    try {
      const metadata = database.getMetadata({ id, user_id: user.id });
      if (!metadata.length) {
        res.status(404).json({ message: `Metadata not found: ${id}` });
      } else {
        database.removeMetadata({ id, user_id: user.id });
        metadata.forEach(({ filekey }) => {
          const filePath = path.join(FILES_DIR, filekey);
          if (fs.existsSync(filePath)) fs.rmSync(filePath);
          const thumbnailPath = path.join(THUMBNAILS_DIR, filekey);
          if (fs.existsSync(thumbnailPath)) fs.rmSync(thumbnailPath);
        });
      }
      res.status(200).json({ message: `Deleted: ${id}` });
    } catch (err: any) {
      const message = "message" in err ? err.message : "Unknown error";
      res.status(404).json({ message: `Failed to delete ${id}: ${message}` });
    }
  }
};

export const deleteRouter: Router = {
  route: "/file/:id",
  handlers: [deleteHandler],
};
