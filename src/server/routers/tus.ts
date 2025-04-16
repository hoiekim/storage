import path from "path";
import fs from "fs";
import express from "express";
import { Server as TusServer, Upload } from "@tus/server";
import { FileStore } from "@tus/file-store";
import {
  database,
  getMetadata,
  getUniqueFilename,
  Metadata,
  getFilePath,
  TWO_DAYS,
  ONE_HOUR,
  encodeBase64,
  TEMP_PATH,
  decodeBase64,
  logger,
} from "server";
import { Router } from "./common";

const uploadApp = express();

interface GenerateUrlOption {
  proto: string;
  host: string;
  path: string;
  id: string;
}

const generateUrl = (req: Request, { proto, host, id }: GenerateUrlOption) => {
  const encodedId = encodeBase64(id);
  return `${proto}://${host}/tus/${encodedId}`;
};

const getFileIdFromRequest = (req: Request, lastPath = "") => {
  const queryRemoved = lastPath.split("?")[0];
  return decodeBase64(queryRemoved);
};

export const stringifyUploadMetdata = (metadata: { [k: string]: string }) => {
  return Object.entries(metadata)
    .map(([key, value]) => `${key} ${encodeBase64(value)}`)
    .join(",");
};

const onUploadCreate = async (req: Request, upload: Upload) => {
  const uploadMetadata = upload.metadata;
  const itemId = (uploadMetadata && uploadMetadata["itemId"]) || null;
  const user = req.node?.req.user;
  if (!user) {
    throw new Error("Unauthorized");
  } else if (!itemId) {
    throw new Error("Invalid request: itemId is required");
  } else {
    const existings = database.getMetadata({ item_id: itemId, user_id: user.id });
    if (Array.isArray(existings) && existings?.length) {
      throw new Error("Invalid request: itemId is already used");
    }
  }
  return {};
};

const onUploadFinish = async (req: Request, upload: Upload) => {
  const uploadMetadata = upload.metadata;
  const itemId = (uploadMetadata && uploadMetadata["itemId"]) || null;
  const user = req.node?.req.user!;
  const temporarilySavedPath = upload.storage?.path;
  if (!temporarilySavedPath) return {};

  const existings = database.getMetadata({ item_id: itemId, user_id: user.id });
  if (Array.isArray(existings) && existings?.length) return {};

  const filekey = path.basename(temporarilySavedPath);

  const destination = getFilePath(user.id, filekey);
  const override: Partial<Metadata> = {};
  if (itemId) override.item_id = itemId;
  if (upload.metadata?.filename) override.filename = upload.metadata.filename;
  const metadata = await getMetadata(user.id, temporarilySavedPath, { override });
  metadata.filename = getUniqueFilename(metadata.filename);
  database.insertMetadata(metadata);
  fs.copyFileSync(temporarilySavedPath, destination);
  return {};
};

const onIncomingRequest = async (req: Request, uploadId: string) => {
  // logger.log(req.node?.req.method, uploadId, req.node?.req.headers);
};

const server = new TusServer({
  path: "/",
  datastore: new FileStore({
    directory: TEMP_PATH,
    expirationPeriodInMilliseconds: TWO_DAYS,
  }),
  generateUrl,
  getFileIdFromRequest,
  onUploadFinish,
  onUploadCreate,
  onIncomingRequest,
});

uploadApp.all("*", server.handle.bind(server));

export const tusRouter: Router = {
  route: "/tus",
  handlers: [uploadApp],
};

let tusCleanerSchedule: Timer;

export const scheduledTusCleaner = () => {
  server
    .cleanUpExpiredUploads()
    .then((number) => number && logger.log(`TusCleaner cleaned up ${number} expired uploads.`))
    .catch(console.error);
  tusCleanerSchedule = setTimeout(scheduledTusCleaner, ONE_HOUR);
  return tusCleanerSchedule;
};
