import { database, isNull, isNumber, isPotentialDate, isString } from "server";
import {
  ALTITUDE,
  CREATED,
  DURATION,
  FILEKEY,
  FILENAME,
  FILESIZE,
  HEIGHT,
  ID,
  ITEM_ID,
  LATITUDE,
  LONGITUDE,
  MIME_TYPE,
  UPLOADED,
  USER,
  USER_ID,
  WIDTH,
} from "./common";

export class Metadata {
  id: number;
  user_id: number;
  filekey: string;
  filename: string;
  filesize: number;
  mime_type: string;
  item_id: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  altitude: number | null;
  latitude: number | null;
  longitude: number | null;
  created: Date | null;
  uploaded: Date;

  constructor(m: Metadata) {
    Metadata.assertType(m);
    this.id = m.id;
    this.user_id = m.user_id;
    this.filekey = m.filekey;
    this.filename = m.filename;
    this.filesize = m.filesize;
    this.mime_type = m.mime_type;
    this.item_id = m.item_id;
    this.width = m.width;
    this.height = m.height;
    this.duration = m.duration;
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

    type Checker = { [x in keyof Metadata]: (e: any) => boolean };
    const checker: Checker = {
      id: isNumber,
      user_id: (e) => isNumber(e) && database.isUserExists(e),
      filekey: isString,
      filename: isString,
      filesize: isNumber,
      mime_type: isString,
      item_id: (e) => isString(e) || isNull(e),
      width: (e) => isNumber(e) || isNull(e),
      height: (e) => isNumber(e) || isNull(e),
      duration: (e) => isNumber(e) || isNull(e),
      altitude: (e) => isNumber(e) || isNull(e),
      latitude: (e) => isNumber(e) || isNull(e),
      longitude: (e) => isNumber(e) || isNull(e),
      created: (e) => isPotentialDate(e) || isNull(e),
      uploaded: isPotentialDate,
    };

    const errors = Object.entries(checker).reduce((a, [k, check]) => {
      if (skip.includes(k) || check(o[k])) return a;
      else a.push(`${k}: ${o[k]} (${typeof o[k]})`);
      return a;
    }, new Array<string>());

    if (errors.length) {
      throw new Error(`There are ${errors.length} wrong type(s):\n${errors.join("\n")}`);
    }
  };
}

export type MetadataSchema = { [k in keyof Metadata]: string };
export const metadataSchema: MetadataSchema = {
  [ID]: "INTEGER NOT NULL PRIMARY KEY",
  [USER_ID]: "INTEGER NOT NULL",
  [FILEKEY]: "TEXT NOT NULL",
  [FILENAME]: "TEXT NOT NULL",
  [FILESIZE]: "INTEGER NOT NULL",
  [MIME_TYPE]: "TEXT NOT NULL",
  [ITEM_ID]: "TEXT UNIQUE",
  [WIDTH]: "INTEGER",
  [HEIGHT]: "INTEGER",
  [DURATION]: "REAL",
  [ALTITUDE]: "REAL",
  [LATITUDE]: "REAL",
  [LONGITUDE]: "REAL",
  [CREATED]: "TEXT",
  [UPLOADED]: "TEXT NOT NULL",
};

export const metadataConstraints = [`FOREIGN KEY(${USER_ID}) REFERENCES ${USER}(${ID})`];

export const lightColumns = Object.keys(metadataSchema).filter(
  (c) => !metadataSchema[c as keyof Metadata].includes("BLOB")
);
