import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import { app, database, FILES_DIR, THUMBNAILS_DIR } from "server";

if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR);
if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR);
database.init();

const { PORT = 3006 } = process.env;
app.listen(PORT, () => {
  console.log(`Storage server running at http://localhost:${PORT}`);
});
