import fs from "fs";
import path from "path";
import { isNumber, isPotentialDate } from "server";
import { getExifMetadata } from "./exiftool";
import { Metadata } from "./sqlite";
import { getPhotoThumbnail, getVideoThumbnail } from "./thumbnails";

export const getMetadata = async (
  filePath: string,
  createThumbnail = true
): Promise<Metadata> => {
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

  const thumbnailPromise = new Promise<Buffer | null>(async (res, rej) => {
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
  const [filesize, thumbnail] = await Promise.all(promises);

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
    width: ImageWidth || null,
    height: ImageHeight || null,
    duration: Duration || null,
    thumbnail,
    altitude: GPSAltitude || null,
    latitude: GPSLatitude || null,
    longitude: GPSLongitude || null,
    created,
    uploaded: new Date(),
  });
};
