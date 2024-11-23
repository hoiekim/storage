import { isNull, isNumber, isPotentialDate, isString } from "server";

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
    if (typeof o !== "object" || isNull(o)) {
      throw new Error(`Input is not a valid object: ${o}`);
    }

    type TypeMapping = { [x in keyof Metadata]: (e: any) => boolean };
    const typeMapping: TypeMapping = {
      id: (e) => isNumber(e),
      filekey: (e) => isString(e),
      filename: (e) => isString(e),
      filesize: (e) => isNumber(e),
      mime_type: (e) => isString(e),
      width: (e) => isNumber(e) || isNull(e),
      height: (e) => isNumber(e) || isNull(e),
      duration: (e) => isNumber(e) || isNull(e),
      thumbnail: (e) => e instanceof Uint8Array || isNull(e),
      altitude: (e) => isNumber(e) || isNull(e),
      latitude: (e) => isNumber(e) || isNull(e),
      longitude: (e) => isNumber(e) || isNull(e),
      created: (e) => isNull(e) || isPotentialDate(e),
      uploaded: (e) => isPotentialDate(e),
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

/**
 * Table name
 */
export const METADATA = "metadata";

/**
 * Column name
 */
export const ID = "id";
/**
 * Column name
 */
export const FILEKEY = "filekey";
/**
 * Column name
 */
export const FILENAME = "filename";
/**
 * Column name
 */
export const FILESIZE = "filesize";
/**
 * Column name
 */
export const MIME_TYPE = "mime_type";
/**
 * Column name
 */
export const WIDTH = "width";
/**
 * Column name
 */
export const HEIGHT = "height";
/**
 * Column name
 */
export const DURATION = "duration";
/**
 * Column name
 */
export const THUMBNAIL = "thumbnail";
/**
 * Column name
 */
export const ALTITUDE = "altitude";
/**
 * Column name
 */
export const LATITUDE = "latitude";
/**
 * Column name
 */
export const LONGITUDE = "longitude";
/**
 * Column name
 */
export const CREATED = "created";
/**
 * Column name
 */
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

export const lightColumns = Object.keys(schema).filter(
  (c) => !schema[c as keyof Metadata].includes("BLOB")
);
