import fs from "fs";
import path from "path";
import { isNumber, isPotentialDate } from "server";
import { getExifMetadata } from "./exiftool";
import { database, Metadata } from "./sqlite";
import { getPhotoThumbnail, getVideoThumbnail } from "./thumbnails";

interface GetMetadatOption {
  override?: Partial<Metadata>;
  createThumbnail?: boolean;
}

export const getMetadata = async (
  filePath: string,
  option: GetMetadatOption = {}
): Promise<Metadata> => {
  const { override, createThumbnail = true } = option;

  const filekey = path.basename(filePath);
  const exif = await getExifMetadata(filePath);

  const {
    FileName,
    MIMEType,
    ImageWidth,
    ImageHeight,
    Duration,
    GPSAltitude,
    GPSLatitude,
    GPSLongitude,
    CreateDate,
    MediaCreateDate,
  } = exif;

  const filesizePromise = new Promise<number>(async (res, rej) => {
    try {
      const stats = await fs.promises.stat(filePath);
      res(stats.size);
    } catch (err: any) {
      console.error(`Failed to get filesize: ${filePath}`);
      rej(err);
    }
  });

  const thumbnailPromise = new Promise<string | null>(async (res, rej) => {
    if (!createThumbnail) return res(null);
    try {
      if (MIMEType.startsWith("image/")) {
        const thumbnail = await getPhotoThumbnail(filePath);
        res(thumbnail);
      } else if (MIMEType.startsWith("video/")) {
        const time = isNumber(Duration) ? (2 * Duration) / 3 : 0;
        const thumbnail = await getVideoThumbnail(filePath, { time });
        res(thumbnail);
      } else {
        res(null);
      }
    } catch (err: any) {
      console.error(`Failed to create thumbnail: ${filePath}`);
      console.error(err);
      res(null);
    }
  });

  const promises = [filesizePromise, thumbnailPromise] as const;
  const [filesize, _] = await Promise.all(promises);

  const created = isPotentialDate(CreateDate)
    ? new Date(CreateDate as any)
    : isPotentialDate(MediaCreateDate)
    ? new Date(MediaCreateDate as any)
    : null;

  return new Metadata({
    id: -1,
    filekey,
    filename: FileName,
    filesize,
    mime_type: MIMEType,
    item_id: null,
    width: ImageWidth || null,
    height: ImageHeight || null,
    duration: Duration || null,
    altitude: GPSAltitude || null,
    latitude: GPSLatitude || null,
    longitude: GPSLongitude || null,
    created,
    uploaded: new Date(),
    ...override,
  });
};

export const getUniqueFilename = (filename: string) => {
  let result = filename;
  let existing = database.getMetadata({ filename });
  while (existing.length) {
    const ext = path.extname(result);
    const name = result.slice(0, -ext.length);
    // Find patthern: "abc(1)", "def (14)" or etc.
    const match = name.match(/\(\d+\)\s*$/);
    if (match) {
      const n = +match[0].slice(1, -1);
      const nameBase = name.slice(0, match.index);
      result = `${nameBase.trimEnd()} (${n + 1})${ext}`;
    } else {
      result = `${name.trimEnd()} (1)${ext}`;
    }
    existing = database.getMetadata({ filename: result });
  }
  return result;
};
