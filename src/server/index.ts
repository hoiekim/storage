import http from "http";
import express from "express";
import { User, database, isTesting } from "./lib";
import {
  authenticate,
  rootRouter,
  getFileRouter,
  thumbnailRouter,
  metadataByIdRouter,
  metadataByFilekeyRouter,
  metadataByItemIdRouter,
  allMetadataRouter,
  deleteRouter,
  getLabelsRouter,
  getMetadataCountByLabelRouter,
  postLabelsRouter,
  tusRouter,
  scheduledTusCleaner,
  stopTusCleanerSchedule,
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
      req: express.Request & {
        user?: User;
        filekey?: string;
      };
    };
  }
}

const createExpressApp = () => {
  const app = express();

  app.use(express.json());
  app.use(authenticate);

  const routers = [
    rootRouter,
    allMetadataRouter,
    metadataByIdRouter,
    metadataByFilekeyRouter,
    metadataByItemIdRouter,
    thumbnailRouter,
    getFileRouter,
    deleteRouter,
    getLabelsRouter,
    getMetadataCountByLabelRouter,
    postLabelsRouter,
    tusRouter,
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

  start = () => {
    database.init();
    const { app, port } = Server;
    const host = `http://localhost:${port}`;
    this.server = app.listen(port, () => {
      if (isTesting) console.log(`Testing Storage server running at ${host}`);
      else console.log(`Storage server running at ${host}`);
      scheduledTusCleaner();
    });
    return this.server;
  };

  close = () => {
    this.server?.close();
    stopTusCleanerSchedule();
  };
}

export * from "./lib";
export * from "./routers";
