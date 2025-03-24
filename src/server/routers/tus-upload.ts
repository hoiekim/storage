import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import express, { Request, Response } from "express";
import { Server as TusServer } from "@tus/server";
import { FileStore } from "@tus/file-store";
import { database, getMetadata, getUniqueFilename, Metadata } from "server";
import { Router } from "./common";
// import directly to avoid circular initialization
import { TEMP_PATH } from "../lib/paths";

const uploadApp = express();

const namingFunction = (req: Request) => {
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

const generateUrl = (req: Request, { proto, host, path, id }: GenerateUrlOption) => {
  id = Buffer.from(id, "utf-8").toString("base64url");
  return `${proto}://${host}${path}/${id}`;
};

const getFileIdFromRequest = (req: Request, lastPath: string) => {
  return Buffer.from(lastPath, "base64url").toString("utf-8");
};

const onUploadFinish = async (req: Request, res: Response, upload: any) => {
  const filekey = req.filekey!;
  const { itemId } = req.params;
  console.log(filekey, itemId);
  const user = req.user!;
  const savedPath = path.join(TEMP_PATH, filekey);

  const existing = itemId && database.getMetadata({ item_id: itemId, user_id: user.id });
  if (existing?.length) {
    fs.rmSync(savedPath);
    return { res };
  }

  const override: Partial<Metadata> = {};
  if (itemId) override.item_id = itemId;
  const metadata = await getMetadata(user.id, savedPath, { override });
  // metadata.filename = getUniqueFilename(filename);
  database.insertMetadata(metadata);

  return { res };
};

const server = new TusServer({
  path: "/",
  // datastore: new FileStore({directory: FILES_DIR})
  datastore: new FileStore({ directory: TEMP_PATH }),
  // @ts-ignore
  namingFunction,
  // @ts-ignore
  generateUrl,
  // @ts-ignore
  getFileIdFromRequest,
  // @ts-ignore
  onUploadFinish,
});

// @ts-ignore
uploadApp.all("*", server.handle.bind(server));

export const uploadRouter: Router = {
  route: "/upload/:itemId",
  handlers: [uploadApp],
};
