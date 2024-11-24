import path from "path";
import { v4 as uuidv4 } from "uuid";
import express, { RequestHandler } from "express";
import multer from "multer";
import { database, getMetadata, getUniqueFilename } from "server";
import { Router, FILES_DIR } from "./common";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, FILES_DIR),
  filename: (req, file, cb) => cb(null, uuidv4()),
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit
  fileFilter: (req, file, cb) => {
    const isPhoto = file.mimetype.startsWith("image/");
    const isViceo = file.mimetype.startsWith("video/");
    if (isPhoto || isViceo) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only photos and videos are allowed."));
    }
  },
});

const uploadHandler: RequestHandler = async (req, res) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ message: "No file uploaded." });
    return;
  }

  try {
    const { filename: filekey, originalname: filename } = file;
    const savedPath = path.join(FILES_DIR, filekey);
    const metadata = await getMetadata(savedPath);
    metadata.filename = getUniqueFilename(filename);
    database.insert(metadata);
    res.status(200).json({
      message: "File uploaded successfully.",
      body: { ...metadata, thumbnail: null },
    });
  } catch (err: any) {
    const message = "message" in err ? err.message : "Unknown error";
    res.status(400).json({ message: `Corrupted file: ${message}` });
  }
};

export const uploadRouter: Router = {
  route: "/file",
  handlers: [upload.single("file"), uploadHandler],
};

export const errorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: `Multer Error: ${err.message}` });
  } else if (err) {
    const message = "message" in err ? err.message : "Unknown error";
    res.status(400).json({ message: `Error: ${message}` });
  } else {
    next();
  }
};
