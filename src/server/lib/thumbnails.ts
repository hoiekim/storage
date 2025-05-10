import path from "path";
import fs from "fs";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import heicConvert from "heic-convert";
import { randomUUID } from "crypto";
import { TEMP_PATH, getThumbnailPath, logger } from "server";

const heicToJpeg = async (filePath: string) => {
  const tempPath = path.join(TEMP_PATH, randomUUID());
  const outputBuffer = await heicConvert({
    // @ts-ignore
    buffer: fs.readFileSync(filePath),
    format: "JPEG",
    quality: 1,
  });

  fs.writeFileSync(tempPath, Buffer.from(outputBuffer));

  return tempPath;
};

export const getPhotoThumbnail = async (
  user_id: number,
  filePath: string,
  { width = 300, silent = false, isHeic = false } = {}
) => {
  let tempPath: string | null = null;

  try {
    const filename = path.basename(filePath);
    const ext = path.extname(filename);
    const filekey = ext.length ? filename.slice(0, -ext.length) : filename;
    const outputPath = getThumbnailPath(user_id, filekey);

    if (isHeic) tempPath = await heicToJpeg(filePath);

    await sharp(tempPath || filePath)
      .jpeg()
      .resize(width, width)
      .withMetadata()
      .toFile(outputPath);

    if (!silent) logger.log(`Photo thumbnail created for ${filePath}`);
    return filekey;
  } catch (err) {
    if (!silent) logger.error("Error creating photo thumbnail:", err);
    throw err;
  } finally {
    if (tempPath) fs.rmSync(tempPath);
  }
};

export const getVideoThumbnail = async (
  user_id: number,
  filePath: string,
  { width = 300, time = 0 } = {}
) => {
  const filename = path.basename(filePath);
  const ext = path.extname(filename);
  const _filekey = ext.length ? filename.slice(0, -ext.length) : filename;
  const tempPath = path.join(TEMP_PATH, `${_filekey}.png`);

  await new Promise<void>((res, rej) => {
    try {
      ffmpeg(filePath)
        .screenshots({
          timestamps: [time],
          filename: _filekey,
          folder: TEMP_PATH,
        })
        .on("end", () => {
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

  const filekey = await getPhotoThumbnail(user_id, tempPath, {
    width,
    silent: true,
  });
  fs.rmSync(tempPath);

  logger.log(`Video thumbnail created for ${filePath}`);

  return filekey;
};
