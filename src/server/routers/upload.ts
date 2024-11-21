import express, { RequestHandler } from "express";
import multer from "multer";
import { Router, UPLOAD_DIR } from "./common";

// Set up Multer for file uploads
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "video/mp4",
      "video/quicktime",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only photos and videos are allowed."));
    }
  },
});

const UPLOAD_ROUTE = "/files/:id";

// Handle file uploads
const uploadHandler: RequestHandler = (req, res) => {
  const file = req.file;

  if (!file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  res.status(200).json({
    message: "File uploaded successfully",
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  });
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
    res.status(400).send(`Multer Error: ${err.message}`);
  } else if (err) {
    res.status(400).send(`Error: ${err.message}`);
  } else {
    next();
  }
};
