import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { IncomingMessage, ServerResponse } from "http";
import express from "express";
import { Server as TusServer } from "@tus/server";
import { FileStore } from "@tus/file-store";
import {
  database,
  getMetadata,
  getUniqueFilename,
  Metadata,
  User,
  getFilePath,
  TWO_DAYS,
  ONE_HOUR,
} from "server";
import { Router } from "./common";
// import directly to avoid circular initialization
import { TEMP_PATH } from "../lib/paths";

const uploadApp = express();

type Req = IncomingMessage & {
  user?: User;
  filekey?: string;
  params?: { [k: string]: string };
};

const namingFunction = (req: Req) => {
  const user = req.user!;
  const filekey = randomUUID();
  req.filekey = filekey;
  return `${user.id}/${filekey}`;
};

interface GenerateUrlOption {
  proto: string;
  host: string;
  path: string;
  id: string;
}

const generateUrl = (req: Req, { proto, host, id }: GenerateUrlOption) => {
  id = Buffer.from(id, "utf-8").toString("base64url");
  return `${proto}://${host}/tus/${id}`;
};

const getFileIdFromRequest = (req: Req, lastPath = "") => {
  const queryRemoved = lastPath.split("?")[0];
  return Buffer.from(queryRemoved, "base64url").toString("utf-8");
};

const onUploadFinish = async (req: Req, res: ServerResponse, upload: any) => {
  const _itemId = req.headers["item-id"];
  const itemId = typeof _itemId === "string" ? _itemId : null;
  const user = req.user!;
  const temporarilySavedPath = upload.storage.path;
  const filekey = path.basename(temporarilySavedPath);

  const existing = itemId && database.getMetadata({ item_id: itemId, user_id: user.id });
  let metadata: Metadata;
  if (Array.isArray(existing) && existing?.length) {
    fs.rmSync(temporarilySavedPath);
    metadata = existing[0];
    res.statusCode = 208;
  } else {
    const destination = getFilePath(user.id, filekey);
    fs.renameSync(temporarilySavedPath, destination);
    const override: Partial<Metadata> = {};
    if (itemId) override.item_id = itemId;
    if (upload.metadata?.filename) override.filename = upload.metadata.filename;
    metadata = await getMetadata(user.id, destination, { override });
    metadata.filename = getUniqueFilename(metadata.filename);
    database.insertMetadata(metadata);
    res.statusCode = 201;
  }

  fs.rmSync(temporarilySavedPath + ".json");

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ message: "Upload complete", body: metadata }));
  return { res };
};

const server = new TusServer({
  path: "/",
  datastore: new FileStore({
    directory: TEMP_PATH,
    expirationPeriodInMilliseconds: TWO_DAYS,
  }),
  namingFunction,
  generateUrl,
  getFileIdFromRequest,
  onUploadFinish,
});

// @ts-ignore
uploadApp.all("*", server.handle.bind(server));

export const tusRouter: Router = {
  route: "/tus",
  handlers: [uploadApp],
};

let tusCleanerSchedule: Timer;

export const scheduledTusCleaner = () => {
  server.cleanUpExpiredUploads().catch(console.error);
  tusCleanerSchedule = setTimeout(scheduledTusCleaner, ONE_HOUR);
  return tusCleanerSchedule;
};
