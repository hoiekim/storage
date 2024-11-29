import express from "express";
import {
  authenticate,
  getFileRouter,
  thumbnailRouter,
  metadataRouter,
  errorHandler,
  uploadRouter,
  uploadWithItemIdRouter,
  allMetadataRouter,
  deleteRouter,
} from "./routers";

const app = express();

app.use(authenticate);

app.get("/", (req, res) => {
  res.status(200).json({ message: "OK" });
});

app.get(metadataRouter.route, ...metadataRouter.handlers);
app.get(allMetadataRouter.route, ...allMetadataRouter.handlers);
app.get(thumbnailRouter.route, ...thumbnailRouter.handlers);
app.get(getFileRouter.route, ...getFileRouter.handlers);
app.delete(deleteRouter.route, ...deleteRouter.handlers);
app.post(uploadRouter.route, ...uploadRouter.handlers);
app.post(uploadWithItemIdRouter.route, ...uploadWithItemIdRouter.handlers);
app.use(errorHandler);

app.use("*", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

export { app };

export * from "./lib";
export * from "./routers";
