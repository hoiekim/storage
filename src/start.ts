import dotenv from "dotenv";
dotenv.config();

import { app } from "./server";
import { getVideoMetadata } from "./server/lib";

const { PORT } = process.env;

// Start server
app.listen(PORT || 3006, async () => {
  console.log(`File server running at http://localhost:${PORT}`);
  const metadata = await getVideoMetadata(
    "/Users/hoiekim/Pictures/backup_videos_2"
  );
  console.log(metadata);
});
