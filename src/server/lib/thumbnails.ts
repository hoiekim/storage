import path from "path";
import fs from "fs";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { TEMP_PATH, getThumbnailPath } from "server";

export const getPhotoThumbnail = async (
  user_id: number,
  filePath: string,
  { width = 300, silent = false } = {}
) => {
  try {
    const filename = path.basename(filePath);
    const ext = path.extname(filename);
    const filekey = ext.length ? filename.slice(0, -ext.length) : filename;
    const outputPath = getThumbnailPath(user_id, filekey);
    await sharp(filePath).jpeg().resize(width, width).withMetadata().toFile(outputPath);
    if (!silent) console.log(`Photo thumbnail created for ${filePath}`);
    return filekey;
  } catch (err) {
    if (!silent) console.error("Error creating photo thumbnail:", err);
    throw err;
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

  console.log(`Video thumbnail created for ${filePath}`);

  return filekey;
};
