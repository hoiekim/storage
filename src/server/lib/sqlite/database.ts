import path from "path";
import { Database, SQLQueryBindings } from "bun:sqlite";
import {
  ALTITUDE,
  CREATED,
  DURATION,
  FILEKEY,
  FILENAME,
  FILESIZE,
  HEIGHT,
  ID,
  LATITUDE,
  LONGITUDE,
  Metadata,
  MIME_TYPE,
  NULL,
  schema,
  TABLE_NAME,
  THUMBNAIL,
  UPLOADED,
  WIDTH,
} from "./model";

const DATABASE_PATH = path.join(__dirname, "../../../../.db");
const database = new Database(DATABASE_PATH);

const queryAll = (sql: string, ...args: SQLQueryBindings[]) => {
  return database
    .prepare<Metadata, SQLQueryBindings[]>(sql)
    .all(...args)
    .map((m) => new Metadata(m));
};

export const init = () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      ${Object.entries(schema)
        .map((c) => c.join(" "))
        .join(",\n")}
    ) STRICT
  `;
  database.exec(createTableSql);
  console.log("Successfully initialized database.");
};

export const insert = (metadata: Metadata) => {
  const sql = `
    INSERT INTO ${TABLE_NAME} (
      ${FILEKEY},
      ${FILENAME},
      ${FILESIZE},
      ${MIME_TYPE},
      ${WIDTH},
      ${HEIGHT},
      ${DURATION},
      ${THUMBNAIL},
      ${ALTITUDE},
      ${LATITUDE},
      ${LONGITUDE},
      ${CREATED},
      ${UPLOADED}
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  return database
    .prepare(sql)
    .run(
      metadata.filekey,
      metadata.filename,
      Math.round(metadata.filesize),
      metadata.mime_type,
      metadata.width && Math.round(metadata.width),
      metadata.height && Math.round(metadata.height),
      metadata.duration,
      metadata.thumbnail,
      metadata.altitude,
      metadata.latitude,
      metadata.longitude,
      metadata.created?.toISOString() || null,
      metadata.uploaded.toISOString()
    );
};

export const update = (metadata: Metadata) => {
  const sql = `
    UPDATE ${TABLE_NAME}
    SET ${FILEKEY} = ?,
        ${FILENAME} = ?,
        ${FILESIZE} = ?,
        ${MIME_TYPE} = ?,
        ${WIDTH} = ?,
        ${HEIGHT} = ?,
        ${DURATION} = ?,
        ${THUMBNAIL} = ?,
        ${ALTITUDE} = ?,
        ${LATITUDE} = ?,
        ${LONGITUDE} = ?,
        ${CREATED} = ?,
        ${UPLOADED} = ?
    WHERE id = ?
  `;

  return database
    .prepare(sql)
    .run(
      metadata.filekey,
      metadata.filename,
      Math.round(metadata.filesize),
      metadata.mime_type,
      metadata.width && Math.round(metadata.width),
      metadata.height && Math.round(metadata.height),
      metadata.duration,
      metadata.thumbnail,
      metadata.altitude,
      metadata.latitude,
      metadata.longitude,
      metadata.created?.toISOString() || null,
      metadata.uploaded.toISOString(),
      metadata.id
    );
};

const prepareValue = (value: any) => {
  // queryable values are string, number and Date.
  if (typeof value === "string") return `'${value}'`;
  else if (typeof value === "number") return value;
  else if (value instanceof Date) return `'${value.toISOString()}'`;
  else if (value === null) return NULL;
  else return null;
};

export const get = (metadata: Partial<Metadata>) => {
  let sql = `SELECT * FROM ${TABLE_NAME}`;
  let where = "where";
  Object.keys(metadata).forEach((key) => {
    const value = prepareValue(metadata[key as keyof Metadata]);
    if (value === null) return;
    // ignore when un-indexed id(< 0) is input as query.
    if (key === "id" && (typeof value !== "number" || value < 0)) return;
    const is = value === NULL ? "is" : "=";
    sql += ` ${where} ${key} ${is} ${value}`;
    if (where === "where") where = "and";
  });
  sql += ` ORDER BY ${UPLOADED}`;
  return queryAll(sql);
};

export const getAll = () => {
  const sql = `
    SELECT
    ${Object.keys(schema)
      .filter((s) => s !== THUMBNAIL)
      .join(", ")}
    FROM ${TABLE_NAME}
  `;
  return queryAll(sql);
};

export const getByFilenameLike = (filename: string) => {
  const sql = `
    SELECT * FROM ${TABLE_NAME}
    where ${FILENAME} like '%${filename}%'
    ORDER BY ${UPLOADED}
  `;
  return queryAll(sql);
};

export const getByCreatedDate = (
  greaterThanOrEqual: Date,
  lessThanOrEqual: Date
) => {
  const sql = `
    SELECT * FROM ${TABLE_NAME}
    where datetime(${CREATED}) >= ?
    and datetime(${CREATED}) <= ?
    ORDER BY ${UPLOADED}
  `;
  const gte = greaterThanOrEqual.toISOString();
  const lte = lessThanOrEqual.toISOString();
  return queryAll(sql, gte, lte);
};

export const getPhotos = () => {
  const sql = `
    SELECT * FROM ${TABLE_NAME}
    where ${MIME_TYPE} like 'image/%'
    ORDER BY ${UPLOADED}
  `;
  return queryAll(sql);
};

export const getVideos = () => {
  const sql = `
    SELECT * FROM ${TABLE_NAME}
    where ${MIME_TYPE} like 'video/%'
    ORDER BY ${UPLOADED}
  `;
  return queryAll(sql);
};
