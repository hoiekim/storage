import fs, { createReadStream } from "fs";
import { RequestHandler } from "express";
import { database, getThumbnailPath } from "server";
import { Router } from "./common";

const thumbnailHandler: RequestHandler & { description?: string } = async (req, res) => {
  const { filekey } = req.params;
  const user = req.user!;

  try {
    const filePath = getThumbnailPath(user.id, filekey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Invalid parameter: ${filekey}`);
    }

    const fileStat = await fs.promises.stat(filePath);
    const metadata = database.getMetadata({ filekey, user_id: user.id });
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

thumbnailHandler.description = "Returns thumbnail found by 'filekey'.";

export const thumbnailRouter: Router = {
  method: "GET",
  route: "/thumbnail/:filekey",
  handlers: [thumbnailHandler],
};
