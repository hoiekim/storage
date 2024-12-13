import path from "path";
import fs, { createReadStream } from "fs";
import { RequestHandler } from "express";
import { database } from "server";
import { FILES_DIR, Router } from "./common";

const getFileHandler: RequestHandler = async (req, res) => {
  const { filekey } = req.params;
  const user = req.user!;

  try {
    const filePath = path.join(FILES_DIR, filekey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Invalid parameter: ${filekey}`);
    }

    const fileStat = await fs.promises.stat(filePath);
    const metadata = database.getMetadata({ filekey, user_id: user.id });
    const mimeType = metadata[0]["mime_type"];
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", fileStat.size);
    res.setHeader("Accept-Ranges", "bytes");

    const range = req.headers.range;

    if (range) {
      const [start, end] = range
        .replace(/bytes=/, "")
        .split("-")
        .map((part) => parseInt(part, 10));

      const chunkStart = isNaN(start) ? 0 : start;
      const chunkEnd = isNaN(end)
        ? fileStat.size - 1
        : Math.min(end, fileStat.size - 1);

      if (chunkStart > chunkEnd) {
        // Invalid range
        res.status(416);
        res.setHeader("Content-Range", `bytes */${fileStat.size}`);
        res.end();
        return;
      }

      res.status(206); // Partial Content
      res.setHeader(
        "Content-Range",
        `bytes ${chunkStart}-${chunkEnd}/${fileStat.size}`
      );
      res.setHeader("Content-Length", chunkEnd - chunkStart + 1);

      const fileStream = createReadStream(filePath, {
        start: chunkStart,
        end: chunkEnd,
      });
      fileStream.pipe(res);
    } else {
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (err: any) {
    const message = "message" in err ? err.message : "Unknown error";
    res.status(404).json({ message: `File not found: ${message}` });
  }
};

export const getFileRouter: Router = {
  method: "GET",
  route: "/file/:filekey",
  handlers: [getFileHandler],
};
