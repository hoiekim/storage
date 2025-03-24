import express from "express";
import { User, database } from "./lib";
import {
  authenticate,
  getFileRouter,
  thumbnailRouter,
  metadataRouter,
  multerErrorHandler,
  postFileRouter,
  postFileWithItemIdRouter,
  allMetadataRouter,
  deleteRouter,
  uploadRouter,
} from "./routers";

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      filekey?: string;
    }
  }
}

const createExpressApp = () => {
  const app = express();

  app.use(authenticate);

  app.get("/", (req, res) => {
    res.status(200).json({ message: "OK" });
  });

  const routers = [
    metadataRouter,
    allMetadataRouter,
    thumbnailRouter,
    getFileRouter,
    deleteRouter,
    uploadRouter,
    postFileRouter,
    postFileWithItemIdRouter,
  ];

  routers.forEach(({ method, route, handlers }) => {
    if (method === "GET") {
      app.get(route, ...handlers);
    } else if (method === "POST") {
      app.post(route, ...handlers);
    } else if (method === "DELETE") {
      app.delete(route, ...handlers);
    } else {
      app.use(route, ...handlers);
    }
  });

  app.use(multerErrorHandler);

  app.use("*", (req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  return app;
};

export const app = createExpressApp();

export const startServer = () => {
  database.init();

  const { PORT = 3006, ENVIRONMENT = "production" } = process.env;
  return app.listen(PORT, () => {
    if (ENVIRONMENT === "production") {
      console.log(`Storage server running at http://localhost:${PORT}`);
    } else if (ENVIRONMENT === "testing") {
      console.log(`Testing Storage server running at http://localhost:${PORT}`);
    }
  });
};

export * from "./lib";
export * from "./routers";
