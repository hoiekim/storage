import dotenv from "dotenv";
dotenv.config();

import { Server } from "./server";

if (require.main === module) {
  new Server().start();
}
