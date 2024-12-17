import { RequestHandler } from "express";
import path from "path";
import fs from "fs";

export const TEMP_DIR = path.join(__dirname, "../../../.temp");
export const FILES_DIR = path.join(__dirname, "../../../.files");

export interface Router {
  method?: "GET" | "POST" | "DELETE";
  route: string;
  handlers: RequestHandler[];
}

export const getFolderPath = (user_id: number) => {
  const folder = path.join(FILES_DIR, user_id.toString());
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  return folder;
};

export const getFilePath = (user_id: number, filekey: string) => {
  return path.join(getFolderPath(user_id), filekey);
};

export const getThumbnailPath = (user_id: number, filekey: string) => {
  const thumbnailsFolder = path.join(getFolderPath(user_id), "thumbnails");
  if (!fs.existsSync(thumbnailsFolder)) fs.mkdirSync(thumbnailsFolder);
  return path.join(thumbnailsFolder, filekey);
};
