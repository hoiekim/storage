import path from "path";
import { Database, SQLQueryBindings } from "bun:sqlite";
import { v4 as uuidv4 } from "uuid";
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
  metadataSchema,
  METADATA,
  UPLOADED,
  WIDTH,
  ITEM_ID,
  User,
  USER,
  metadataConstraints,
  userSchema,
  API_KEY,
  USERNAME,
  ADMIN,
  USER_ID,
} from "./models";

const DATABASE_PATH = path.join(__dirname, "../../../../.db");
const database = new Database(DATABASE_PATH);

type Schema = { [k: string]: string };
type Constarints = string[];

const getTableCreationQuery = (
  tableName: string,
  schema: Schema,
  constraints: Constarints = []
) => {
  return `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${Object.entries(schema)
        .map(([column, description]) => `${column} ${description}`)
        .concat(constraints)
        .join(",\n")}
    ) STRICT
  `;
};

export const init = () => {
  const createMetadataTableSql = getTableCreationQuery(
    METADATA,
    metadataSchema,
    metadataConstraints
  );
  database.exec(createMetadataTableSql);

  const createUserTableSql = getTableCreationQuery(USER, userSchema);
  database.exec(createUserTableSql);

  const allUsers = queryUser(`SELECT * from ${USER}`);
  if (!allUsers.length) {
    console.log("No users found in the database. Creating admin user...");
    const api_key = uuidv4();
    const username = ADMIN;
    insertUser(new User({ id: -1, username, api_key, created: new Date() }));
    console.log(`Successfully created user\n-> username: ${username}\n-> api_key: ${api_key}`);
  }

  console.log("Successfully initialized database.");
};

export const insertMetadata = (metadata: Metadata) => {
  const sql = `
    INSERT INTO ${METADATA} (
      ${USER_ID},
      ${FILEKEY},
      ${FILENAME},
      ${FILESIZE},
      ${MIME_TYPE},
      ${ITEM_ID},
      ${WIDTH},
      ${HEIGHT},
      ${DURATION},
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
      metadata.user_id,
      metadata.filekey,
      metadata.filename,
      Math.round(metadata.filesize),
      metadata.mime_type,
      metadata.item_id,
      metadata.width && Math.round(metadata.width),
      metadata.height && Math.round(metadata.height),
      metadata.duration,
      metadata.altitude,
      metadata.latitude,
      metadata.longitude,
      metadata.created?.toISOString() || null,
      metadata.uploaded.toISOString()
    );
};

export const updateMetadata = (metadata: Metadata) => {
  const sql = `
    UPDATE ${METADATA}
    SET ${USER_ID} = ?,
        ${FILEKEY} = ?,
        ${FILENAME} = ?,
        ${FILESIZE} = ?,
        ${MIME_TYPE} = ?,
        ${ITEM_ID} = ?,
        ${WIDTH} = ?,
        ${HEIGHT} = ?,
        ${DURATION} = ?,
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
      metadata.user_id,
      metadata.filekey,
      metadata.filename,
      Math.round(metadata.filesize),
      metadata.mime_type,
      metadata.item_id,
      metadata.width && Math.round(metadata.width),
      metadata.height && Math.round(metadata.height),
      metadata.duration,
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

const prepareQuery = (metadata: Partial<Metadata> | Partial<User>) => {
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

const queryMetadata = (sql: string, ...args: SQLQueryBindings[]) => {
  return database
    .prepare<Metadata, SQLQueryBindings[]>(sql)
    .all(...args)
    .map((m) => {
      const nullified: any = { ...m };
      Object.keys(metadataSchema).forEach((c) => {
        if (!isDefined(nullified[c])) nullified[c] = null;
      });
      return new Metadata(nullified);
    });
};

export const removeMetadata = (metadata: Partial<Metadata>) => {
  const query = prepareQuery(metadata);
  const sql = `
    DELETE FROM ${METADATA}
    ${query}
  `;
  return queryMetadata(sql);
};

export const getMetadata = (metadata: Partial<Metadata>) => {
  const query = prepareQuery(metadata);
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    ${query}
  `;
  return queryMetadata(sql);
};

export const getAllMetadata = () => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
  `;
  return queryMetadata(sql);
};

export const getMetadataByFilenameLike = (filename: string) => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE ${FILENAME} LIKE '%${filename}%'
  `;
  return queryMetadata(sql);
};

export const getMetadataByCreatedDate = (greaterThanOrEqual: Date, lessThanOrEqual: Date) => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE datetime(${CREATED}) >= ?
    AND datetime(${CREATED}) <= ?
  `;
  const gte = greaterThanOrEqual.toISOString();
  const lte = lessThanOrEqual.toISOString();
  return queryMetadata(sql, gte, lte);
};

export const getAllPhotoMetadata = () => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE ${MIME_TYPE} LIKE 'image/%'
  `;
  return queryMetadata(sql);
};

export const getAllVideoMetadata = () => {
  const sql = `
    SELECT ${lightColumns.join(", ")}
    FROM ${METADATA}
    WHERE ${MIME_TYPE} LIKE 'video/%'
  `;
  return queryMetadata(sql);
};

export const insertUser = (user: User) => {
  const sql = `
    INSERT INTO ${USER} (
      ${USERNAME},
      ${API_KEY},
      ${CREATED}
    ) VALUES (?, ?, ?)
  `;

  return database.prepare(sql).run(user.username, user.api_key, user.created.toISOString());
};

const queryUser = (sql: string, ...args: SQLQueryBindings[]) => {
  return database
    .prepare<User, SQLQueryBindings[]>(sql)
    .all(...args)
    .map((u) => {
      const nullified: any = { ...u };
      Object.keys(userSchema).forEach((c) => {
        if (!isDefined(nullified[c])) nullified[c] = null;
      });
      return new User(nullified);
    });
};

export const getUser = (user: Partial<User>) => {
  const query = prepareQuery(user);
  const sql = `
    SELECT *
    FROM ${USER}
    ${query}
  `;
  return queryUser(sql);
};

export const isUserExists = (id: number) => {
  return getUser({ id }).length === 1;
};
