import path from "path";
import { v4 as uuidv4 } from "uuid";
import express, { RequestHandler } from "express";
import multer from "multer";
import { database, getMetadata } from "server";
import { Router, UPLOAD_DIR } from "./common";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const isPhoto = file.mimetype.startsWith("image/");
    const isViceo = file.mimetype.startsWith("video/");
    const isAllowedType = isPhoto || isViceo;
    if (isAllowedType) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only photos and videos are allowed."));
    }
  },
});

const UPLOAD_ROUTE = "/files/:id";

const uploadHandler: RequestHandler = async (req, res) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ message: "No file uploaded." });
    return;
  }

  try {
    const savedPath = path.join(UPLOAD_DIR, file.filename);
    const metadata = await getMetadata(savedPath);
    metadata.filename = file.originalname;
    database.insert(metadata);
    res.status(200).json({
      message: "File uploaded successfully.",
      body: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
  } catch (err: any) {
    const message = "message" in err ? err.message : "Unknown error";
    res.status(400).json({ message: `Corrupted file: ${message}` });
  }
};

export const uploadRouter: Router = {
  routeName: UPLOAD_ROUTE,
  routeHandlers: [upload.single("file"), uploadHandler],
};

// Error handling for file uploads
export const uploadErrorHandler = (
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
