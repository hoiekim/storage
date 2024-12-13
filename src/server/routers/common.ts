import { RequestHandler } from "express";
import path from "path";

export const TEMP_DIR = path.join(__dirname, "../../../.temp");
export const FILES_DIR = path.join(__dirname, "../../../.files");

export interface Router {
  method?: "GET" | "POST" | "DELETE";
  route: string;
  handlers: RequestHandler[];
}

export const getFolderPath = (user_id: number) => {
  return path.join(FILES_DIR, user_id.toString());
};

export const getFilePath = (user_id: number, filekey: string) => {
  return path.join(getFolderPath(user_id), filekey);
};

export const getThumbnailPath = (user_id: number, filekey: string) => {
  return path.join(getFolderPath(user_id), "thumbnails", filekey);
};
