import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";

export const getPhotoThumbnail = async (
  filePath: string,
  { width = 500, silent = false } = {}
) => {
  try {
    const buffer = await sharp(filePath).resize(width, width).toBuffer();
    if (!silent) console.log(`Photo thumbnail created for ${filePath}`);
    return buffer;
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
        .screenshots({
          timestamps: [time],
          size: `${width}x?`,
          filename: tempId,
          folder: TEMP_DIR,
        })
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

  const thumbnail = await getPhotoThumbnail(tempPath, {
    width,
    silent: true,
  });
  fs.rmSync(tempPath);

  return thumbnail;
};
