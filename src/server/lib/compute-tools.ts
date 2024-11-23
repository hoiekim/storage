import fs from "fs";
import path from "path";
import { getExifMetadata } from "./exiftool";
import { Metadata } from "./sqlite";
import { createPhotoThumbnail, createVideoThumbnail } from "./thumbnails";

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
      const isPhoto = MIMEType.startsWith("image/");
      const isVideo = MIMEType.startsWith("video/");
      const photoThumb = isPhoto ? await createPhotoThumbnail(filePath) : null;
      const videoThumb = isVideo ? await createVideoThumbnail(filePath) : null;
      res(photoThumb || videoThumb);
    } catch (err: any) {
      console.error(`Failed to create thumbnail: ${filePath}`);
      console.error(err);
      res(null);
    }
  });

  const promises = [filesizePromise, thumbnailPromise] as const;
  const [filesize, thumbnail] = await Promise.all(promises);

  const createdDate = new Date(CreateDate as any);
  const mediaCreatedDate = new Date(MediaCreateDate as any);

  const created = !!createdDate.getTime()
    ? createdDate
    : !!mediaCreatedDate?.getTime()
    ? mediaCreatedDate
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
