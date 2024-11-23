import dotenv from "dotenv";
dotenv.config();

import { app, database } from "server";

database.init();

const { PORT = 3006 } = process.env;
app.listen(PORT, () => {
  console.log(`File server running at http://localhost:${PORT}`);
});
