import express from "express";
import {
  authenticate,
  filesRouter,
  metadataRouter,
  uploadErrorHandler,
  uploadRouter,
} from "./routers";

const app = express();

app.use(authenticate);
app.get(filesRouter.routeName, ...filesRouter.routeHandlers);
app.get(metadataRouter.routeName, ...metadataRouter.routeHandlers);
app.get(uploadRouter.routeName, ...uploadRouter.routeHandlers);
app.use(uploadErrorHandler);

export { app };

export * from "./lib";
export * from "./routers";
