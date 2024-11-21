import path from "path";
import { DatabaseSync } from "node:sqlite";
import { v4 as uuidv4 } from "uuid";

const DATABASE_PATH = path.join(__dirname, "../../../database.db");
const database = new DatabaseSync(DATABASE_PATH);

export const init = () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      id INTEGER PRIMARY KEY,
      filename TEXT,
      filesize TEXT,
      created DATE,
      uploaded DATE,
      mime_type TEXT,
      width SMALLINT UNSIGNED,
      height SMALLINT UNSIGNED,
      video_length_seconds SMALLINT,
      thumbnail BLOB
    ) STRICT
  `);
  console.log("Successfully initialized database.");
};

class Metadata {
  id: string;
  filename: string;
  filesize: number;
  mime_type: string;
  width: number;
  height: number;
  video_length_seconds: number | null;
  thumbnail: Blob;
  created: Date;
  uploaded: Date;

  constructor(init: Omit<Metadata, "id">) {
    this.id = uuidv4();
    this.filename = init.filename;
    this.filesize = init.filesize;
    this.mime_type = init.mime_type;
    this.width = init.width;
    this.height = init.height;
    this.video_length_seconds = init.video_length_seconds;
    this.thumbnail = init.thumbnail;
    this.created = init.created;
    this.uploaded = init.uploaded;
  }
}

export const insert = async (metadata: Metadata) => {
  const insertCommand = database.prepare(`
    INSERT INTO metadata (
      id,
      filename,
      filesize,
      mime_type,
      width,
      height,
      video_length_seconds,
      thumbnail,
      created,
      uploaded
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const {
    id,
    filename,
    filesize,
    mime_type,
    width,
    height,
    video_length_seconds,
    thumbnail,
    created,
    uploaded,
  } = metadata;

  const thumbnailArray = new Uint8Array(await thumbnail.arrayBuffer());

  insertCommand.run(
    id,
    filename,
    filesize,
    mime_type,
    width,
    height,
    video_length_seconds,
    thumbnailArray,
    created.toISOString(),
    uploaded.toISOString()
  );
};

export const get = (metadata: Partial<Metadata>) => {
  let getSql = "SELECT * FROM metadata ORDER BY uploaded";
  const columns = Object.keys(metadata).filter(
    (c) => !!metadata[c as keyof Metadata]
  );
  columns.forEach((c, i) => {
    const where = !i ? "where" : "and";
    getSql = [getSql, where, c, "=", metadata[c as keyof Metadata]].join(" ");
  });
  return database.exec(getSql);
};

export const getByFilenameLike = (filename: string) => {
  const getSql = `
    SELECT * FROM metadata ORDER BY uploaded where filename like %${filename}%
  `;
  return database.exec(getSql);
};

export const getByCreatedDate = (
  greaterThanOrEqual: Date,
  lessThanOrEqual: Date
) => {
  const getSql = `
    SELECT * FROM metadata ORDER BY uploaded
      where created >= ${greaterThanOrEqual}
      and created <= ${lessThanOrEqual}
  `;
  return database.exec(getSql);
};
