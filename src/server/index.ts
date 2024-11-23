import express from "express";
import {
  authenticate,
  fileRouter,
  metadataByIdRouter,
  metadataRouter,
  uploadErrorHandler,
  uploadRouter,
} from "./routers";

const app = express();

app.use(authenticate);
app.get(fileRouter.routeName, ...fileRouter.routeHandlers);
app.get(metadataRouter.routeName, ...metadataRouter.routeHandlers);
app.post(uploadRouter.routeName, ...uploadRouter.routeHandlers);
app.use(uploadErrorHandler);

export { app };

export * from "./lib";
export * from "./routers";
