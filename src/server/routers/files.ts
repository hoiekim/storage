import path from "path";
import fs, { createReadStream } from "fs";
import { RequestHandler } from "express";
import mime from "mime-types";

import { PUBLIC_DIR, Router } from "./common";

const FILES_ROUTE = "/files/:id";

const filesHandler: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const filePath = path.join(PUBLIC_DIR, id);

  try {
    const fileStat = await fs.promises.stat(filePath);
    const mimeType = mime.lookup(filePath) || "application/octet-stream";
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

export const filesRouter: Router = {
  routeName: FILES_ROUTE,
  routeHandlers: [filesHandler],
};
