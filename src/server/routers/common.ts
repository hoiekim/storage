import { RequestHandler } from "express";

export interface Router {
  method?: "GET" | "POST" | "DELETE";
  route: string;
  handlers: RequestHandler[];
}
