export class Metadata {
  id: number;
  filekey: string;
  filename: string;
  filesize: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  thumbnail: Buffer | null;
  altitude: number | null;
  latitude: number | null;
  longitude: number | null;
  created: Date | null;
  uploaded: Date;

  constructor(m: Metadata) {
    Metadata.assertType(m);
    this.id = m.id;
    this.filekey = m.filekey;
    this.filename = m.filename;
    this.filesize = m.filesize;
    this.mime_type = m.mime_type;
    this.width = m.width;
    this.height = m.height;
    this.duration = m.duration;
    this.thumbnail = m.thumbnail;
    this.altitude = m.altitude;
    this.latitude = m.latitude;
    this.longitude = m.longitude;
    this.created = m.created && new Date(m.created);
    this.uploaded = new Date(m.uploaded);
  }

  static assertType = (o: any, skip: string[] = []) => {
    if (typeof o !== "object" || o === null) {
      throw new Error(`Input is not a valid object: ${o}`);
    }

    type TypeMapping = { [x in keyof Metadata]: (e: any) => boolean };
    const typeMapping: TypeMapping = {
      id: (e) => typeof e === "number",
      filekey: (e) => typeof e === "string",
      filename: (e) => typeof e === "string",
      filesize: (e) => typeof e === "number",
      mime_type: (e) => typeof e === "string",
      width: (e) => typeof e === "number" || e === null,
      height: (e) => typeof e === "number" || e === null,
      duration: (e) => typeof e === "number" || e === null,
      thumbnail: (e) => e instanceof Uint8Array || e === null,
      altitude: (e) => typeof e === "number" || e === null,
      latitude: (e) => typeof e === "number" || e === null,
      longitude: (e) => typeof e === "number" || e === null,
      created: (e) => e === null || !!new Date(e).getTime(),
      uploaded: (e) => !!new Date(e).getTime(),
    };

    const errors = Object.entries(typeMapping).reduce((a, [k, check]) => {
      if (skip.includes(k) || check(o[k])) return a;
      else a.push(`${k}: ${o[k]} (${typeof o[k]})`);
      return a;
    }, new Array<string>());

    if (errors.length) {
      throw new Error(
        `There are ${errors.length} wrong type(s):\n${errors.join("\n")}`
      );
    }
  };
}

export const ID = "id";
export const FILEKEY = "filekey";
export const FILENAME = "filename";
export const FILESIZE = "filesize";
export const MIME_TYPE = "mime_type";
export const WIDTH = "width";
export const HEIGHT = "height";
export const DURATION = "duration";
export const THUMBNAIL = "thumbnail";
export const ALTITUDE = "altitude";
export const LATITUDE = "latitude";
export const LONGITUDE = "longitude";
export const CREATED = "created";
export const UPLOADED = "uploaded";

export const NULL = "NULL";

export type Schema = { [k in keyof Metadata]: string };
export const schema: Schema = {
  [ID]: "INTEGER NOT NULL PRIMARY KEY",
  [FILEKEY]: "TEXT NOT NULL",
  [FILENAME]: "TEXT NOT NULL",
  [FILESIZE]: "INTEGER NOT NULL",
  [MIME_TYPE]: "TEXT NOT NULL",
  [WIDTH]: "INTEGER",
  [HEIGHT]: "INTEGER",
  [DURATION]: "REAL",
  [THUMBNAIL]: "BLOB",
  [ALTITUDE]: "REAL",
  [LATITUDE]: "REAL",
  [LONGITUDE]: "REAL",
  [CREATED]: "TEXT",
  [UPLOADED]: "TEXT NOT NULL",
};

export const TABLE_NAME = "metadata";
