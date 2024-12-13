import { RequestHandler } from "express";
import path from "path";

export const TEMP_DIR = path.join(__dirname, "../../../.temp");
export const FILES_DIR = path.join(__dirname, "../../../.files");
export const THUMBNAILS_DIR = path.join(FILES_DIR, "thumbnails");

export interface Router {
  method?: "GET" | "POST" | "DELETE";
  route: string;
  handlers: RequestHandler[];
}
