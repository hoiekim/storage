import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { THUMBNAILS_DIR } from "server/routers";

export const getPhotoThumbnail = async (
  filePath: string,
  { width = 500, silent = false } = {}
) => {
  try {
    const thumbnailId = uuidv4();
    const outputPath = path.join(THUMBNAILS_DIR, thumbnailId);
    await sharp(filePath).resize(width, width).toFile(outputPath);
    if (!silent) console.log(`Photo thumbnail created for ${filePath}`);
    return thumbnailId;
  } catch (err) {
    if (!silent) console.error("Error creating photo thumbnail:", err);
    throw err;
  }
};

const TEMP_DIR = path.join(__dirname, "../../../.temp");

export const getVideoThumbnail = async (
  filePath: string,
  { width = 500, time = 0 } = {}
) => {
  const tempId = uuidv4();
  const tempPath = path.join(TEMP_DIR, `${tempId}.png`);

  await new Promise<void>((res, rej) => {
    try {
      ffmpeg(filePath)
        .screenshots({ timestamps: [time], filename: tempId, folder: TEMP_DIR })
        .on("end", () => {
          console.log(`Video thumbnail created for ${filePath}`);
          res();
        })
        .on("error", (err) => {
          console.error("Error creating video thumbnail:", err);
          rej(err);
        });
    } catch (err: any) {
      rej(err);
    }
  });

  const thumbnailId = await getPhotoThumbnail(tempPath, {
    width,
    silent: true,
  });
  fs.rmSync(tempPath);

  return thumbnailId;
};
