import { RequestHandler } from "express";
import path from "path";

export const PUBLIC_DIR = path.join(__dirname, "../../../public");
export const UPLOAD_DIR = PUBLIC_DIR;

export interface Router {
  routeName: string;
  routeHandlers: RequestHandler[];
}
