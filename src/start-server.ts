import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import { app, database, FILES_DIR, TEMP_DIR } from "server";

const main = () => {
  if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR);
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);
  database.init();

  const { PORT = 3006 } = process.env;
  app.listen(PORT, () => {
    console.log(`Storage server running at http://localhost:${PORT}`);
  });
};

main();
