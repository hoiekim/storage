import fs from "fs";
import path from "path";
import { isNumber } from "server";
import { getExifMetadata } from "./exiftool";
import { database, Metadata } from "./sqlite";
import { getPhotoThumbnail, getVideoThumbnail } from "./thumbnails";

interface GetMetadatOption {
  override?: Partial<Metadata>;
  createThumbnail?: boolean;
}

export const getMetadata = async (
  user_id: number,
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
    CreationDate,
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
        const isHeic = MIMEType === "image/heic";
        const thumbnail = await getPhotoThumbnail(user_id, filePath, { isHeic });
        res(thumbnail);
      } else if (MIMEType.startsWith("video/")) {
        const time = isNumber(Duration) ? Duration / 2 : 0;
        const thumbnail = await getVideoThumbnail(user_id, filePath, { time });
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

  const createdDate1 = new Date(CreateDate as any);
  const createdDate2 = new Date(MediaCreateDate as any);
  const createdDate3 = new Date(CreationDate as any);

  const created = [createdDate1, createdDate2, createdDate3]
    .filter((d) => !!d.getTime())
    .reduce((acc, d) => (acc < d ? acc : d), new Date());

  return new Metadata({
    id: -1,
    user_id,
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

export const getUniqueFilename = (user_id: number, filename: string) => {
  let result = filename;
  let existing = database.getMetadata({ user_id, filename });
  while (existing.length) {
    const ext = path.extname(result);
    const name = result.slice(0, -ext.length);
    // Find patthern: "abc(1)", "def (2)" and so on.
    const match = name.match(/\(\d+\)\s*$/);
    if (match) {
      const n = +match[0].slice(1, -1);
      const nameBase = name.slice(0, match.index);
      result = `${nameBase.trimEnd()} (${n + 1})${ext}`;
    } else {
      result = `${name.trimEnd()} (1)${ext}`;
    }
    existing = database.getMetadata({ user_id, filename: result });
  }
  return result;
};
