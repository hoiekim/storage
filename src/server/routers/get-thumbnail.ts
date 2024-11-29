import path from "path";
import fs, { createReadStream } from "fs";
import { RequestHandler } from "express";
import { database } from "server";
import { THUMBNAILS_DIR, Router } from "./common";

const thumbnailHandler: RequestHandler = async (req, res) => {
  const { filekey } = req.params;

  try {
    const filePath = path.join(THUMBNAILS_DIR, filekey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Invalid parameter: ${filekey}`);
    }

    const fileStat = await fs.promises.stat(filePath);
    const metadata = database.getMetadata({ filekey });
    const mimeType = metadata[0]["mime_type"];
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", fileStat.size);
    res.setHeader("Accept-Ranges", "bytes");

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err: any) {
    const message = "message" in err ? err.message : "Unknown error";
    res.status(404).json({ message: `Thumbnail not found: ${message}` });
  }
};

export const thumbnailRouter: Router = {
  route: "/thumbnail/:filekey",
  handlers: [thumbnailHandler],
};
