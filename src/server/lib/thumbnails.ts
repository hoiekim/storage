import path from "path";
import fs from "fs";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { THUMBNAILS_DIR } from "server/routers";

export const getPhotoThumbnail = async (
  filePath: string,
  { width = 300, silent = false } = {}
) => {
  try {
    const filename = path.basename(filePath);
    const ext = path.extname(filename);
    const filekey = ext.length ? filename.slice(0, -ext.length) : filename;
    const outputPath = path.join(THUMBNAILS_DIR, filekey);
    await sharp(filePath).jpeg().resize(width, width).toFile(outputPath);
    if (!silent) console.log(`Photo thumbnail created for ${filePath}`);
    return filekey;
  } catch (err) {
    if (!silent) console.error("Error creating photo thumbnail:", err);
    throw err;
  }
};

const TEMP_DIR = path.join(__dirname, "../../../.temp");

export const getVideoThumbnail = async (
  filePath: string,
  { width = 300, time = 0 } = {}
) => {
  const filename = path.basename(filePath);
  const ext = path.extname(filename);
  const _filekey = ext.length ? filename.slice(0, -ext.length) : filename;
  const tempPath = path.join(TEMP_DIR, `${_filekey}.png`);

  await new Promise<void>((res, rej) => {
    try {
      ffmpeg(filePath)
        .screenshots({
          timestamps: [time],
          filename: _filekey,
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

  const filekey = await getPhotoThumbnail(tempPath, { width, silent: true });
  fs.rmSync(tempPath);

  return filekey;
};
