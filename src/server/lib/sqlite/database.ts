import path from "path";
import { Database, SQLQueryBindings } from "bun:sqlite";
import { isDate, isDefined, isNull, isNumber, isString } from "server";
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
  lightColumns,
  LONGITUDE,
  Metadata,
  MIME_TYPE,
  NULL,
  schema,
  METADATA,
  THUMBNAIL,
  UPLOADED,
  WIDTH,
} from "./model";

const DATABASE_PATH = path.join(__dirname, "../../../../.db");
const database = new Database(DATABASE_PATH);

export const init = () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${METADATA} (
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
    INSERT INTO ${METADATA} (
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
    UPDATE ${METADATA}
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
    WHERE ${ID} = ?
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

const queryAll = (sql: string, ...args: SQLQueryBindings[]) => {
  return database
    .prepare<Metadata, SQLQueryBindings[]>(sql)
    .all(...args)
    .map((m) => new Metadata(m));
};

const prepareWhere = (where?: string) => (where === "WHERE" ? "AND" : "WHERE");
const prepareIs = (value: any) => (value === NULL ? "IS" : "=");
const prepareValue = (value: any) => {
  // queryable values are string, number, Date and null.
  if (isString(value)) return `'${value}'`;
  else if (isNumber(value)) return value;
  else if (isDate(value)) return `'${value.toISOString()}'`;
  else if (isNull(value)) return NULL;
  else return undefined;
};

export const get = (metadata: Partial<Metadata>) => {
  let sql = `SELECT * FROM ${METADATA}`;
  let where: string;
  Object.entries(metadata).forEach(([key, v]) => {
    const value = prepareValue(v);
    // ignore when un-indexed id(< 0) is input as query.
    if (key === ID && (!isNumber(value) || value < 0)) return;
    if (!isDefined(value)) return;
    where = prepareWhere(where);
    const is = prepareIs(value);
    sql += ` ${where} ${key} ${is} ${value}`;
  });
  return queryAll(sql);
};

export const getAll = () => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
  `;
  return queryAll(sql);
};

export const getByFilenameLike = (filename: string) => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE ${FILENAME} LIKE '%${filename}%'
  `;
  return queryAll(sql);
};

export const getByCreatedDate = (
  greaterThanOrEqual: Date,
  lessThanOrEqual: Date
) => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE datetime(${CREATED}) >= ?
    AND datetime(${CREATED}) <= ?
  `;
  const gte = greaterThanOrEqual.toISOString();
  const lte = lessThanOrEqual.toISOString();
  return queryAll(sql, gte, lte);
};

export const getPhotos = () => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE ${MIME_TYPE} LIKE 'image/%'
  `;
  return queryAll(sql);
};

export const getVideos = () => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE ${MIME_TYPE} LIKE 'video/%'
  `;
  return queryAll(sql);
};
