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
  THUMBNAIL_ID,
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
      ${THUMBNAIL_ID},
      ${ALTITUDE},
      ${LATITUDE},
      ${LONGITUDE},
      ${CREATED},
      ${UPLOADED}
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      metadata.thumbnail_id,
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
        ${THUMBNAIL_ID} = ?,
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
      metadata.thumbnail_id,
      metadata.altitude,
      metadata.latitude,
      metadata.longitude,
      metadata.created?.toISOString() || null,
      metadata.uploaded.toISOString(),
      metadata.id
    );
};

const prepareValue = (value: any) => {
  // queryable values are string, number, Date and null.
  if (isString(value)) return `'${value}'`;
  else if (isNumber(value)) return value;
  else if (isDate(value)) return `'${value.toISOString()}'`;
  else if (isNull(value)) return NULL;
  else return undefined;
};

const prepareQuery = (metadata: Partial<Metadata>) => {
  const queries: string[] = [];
  Object.entries(metadata).forEach(([key, v]) => {
    const value = prepareValue(v);
    // ignore when un-indexed id(< 0) is input as query.
    if (key === ID && (!isNumber(value) || value < 0)) return;
    if (!isDefined(value)) return;
    const where = !queries.length ? "where" : "and";
    const is = value === NULL ? "IS" : "=";
    queries.push(`${where} ${key} ${is} ${value}`);
  });
  return queries.join("\n");
};

export const remove = (metadata: Partial<Metadata>) => {
  const query = prepareQuery(metadata);
  const sql = `
    DELETE FROM ${METADATA}
    ${query}
  `;
  return queryAll(sql);
};

const queryAll = (sql: string, ...args: SQLQueryBindings[]) => {
  return database
    .prepare<Metadata, SQLQueryBindings[]>(sql)
    .all(...args)
    .map((m) => {
      const nullified: any = { ...m };
      Object.keys(schema).forEach((c) => {
        if (!isDefined(nullified[c])) nullified[c] = null;
      });
      return new Metadata(nullified);
    });
};

export const getMetadata = (metadata: Partial<Metadata>) => {
  const query = prepareQuery(metadata);
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    ${query}
  `;
  return queryAll(sql);
};

export const getAllMetadata = () => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
  `;
  return queryAll(sql);
};

export const getMetadataByFilenameLike = (filename: string) => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE ${FILENAME} LIKE '%${filename}%'
  `;
  return queryAll(sql);
};

export const getMetadataByCreatedDate = (
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

export const getAllPhotoMetadata = () => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE ${MIME_TYPE} LIKE 'image/%'
  `;
  return queryAll(sql);
};

export const getAllVideoMetadata = () => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE ${MIME_TYPE} LIKE 'video/%'
  `;
  return queryAll(sql);
};
