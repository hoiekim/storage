import http from "http";
import express from "express";
import { User, database, isTesting } from "./lib";
import {
  authenticate,
  rootRouter,
  getFileRouter,
  thumbnailRouter,
  metadataRouter,
  multerErrorHandler,
  postFileRouter,
  postFileWithItemIdRouter,
  allMetadataRouter,
  deleteRouter,
  tusRouter,
  scheduledTusCleaner,
} from "./routers";

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      filekey?: string;
    }
  }
}

declare global {
  export interface Request {
    node?: {
      req: {
        user?: User;
        filekey?: string;
      };
    };
  }
}

const createExpressApp = () => {
  const app = express();

  app.use(authenticate);

  const routers = [
    rootRouter,
    metadataRouter,
    allMetadataRouter,
    thumbnailRouter,
    getFileRouter,
    deleteRouter,
    tusRouter,
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

const { PORT = "3006" } = process.env;

export class Server {
  static port = PORT;
  port = Server.port;

  static app = createExpressApp();
  app = Server.app;

  server: http.Server | undefined;

  private tusCleanerSchedule: Timer | undefined;

  start = () => {
    database.init();
    const { app, port } = Server;
    const host = `http://localhost:${port}`;
    this.server = app.listen(port, () => {
      if (isTesting) console.log(`Testing Storage server running at ${host}`);
      else console.log(`Storage server running at ${host}`);
      this.tusCleanerSchedule = scheduledTusCleaner();
    });
    return this.server;
  };

  close = () => {
    this.server?.close();
    clearTimeout(this.tusCleanerSchedule);
  };
}

export * from "./lib";
export * from "./routers";
