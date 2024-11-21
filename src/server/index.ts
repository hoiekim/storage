import express from "express";
import { filesRouter, uploadErrorHandler, uploadRouter } from "./routers";

const app = express();

app.get(filesRouter.routeName, ...filesRouter.routeHandlers);
app.get(uploadRouter.routeName, ...uploadRouter.routeHandlers);
app.use(uploadErrorHandler);

export { app };
