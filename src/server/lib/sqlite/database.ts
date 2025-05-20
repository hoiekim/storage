import { Database, SQLQueryBindings } from "bun:sqlite";
import { randomUUID } from "crypto";
import { DB_PATH, isDate, isDefined, isNull, isNumber, isString, isTesting, logger } from "server";
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
  metadataColumns,
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
  LABEL,
  METADATA_ID,
  LABELNAME,
} from "./models";
import { Label, labelColumns, labelConstraints, labelSchema } from "./models/label";

const database = new Database(DB_PATH);

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

  const createLabelTableSql = getTableCreationQuery(LABEL, labelSchema, labelConstraints);
  database.exec(createLabelTableSql);

  const allUsers = queryUser(`SELECT * from ${USER}`);

  if (!allUsers.find((u) => u.username === ADMIN)) {
    logger.log("No admin user found in the database. Creating admin user...");
    const api_key = isTesting ? ADMIN : randomUUID();
    insertUser(new User({ id: -1, username: ADMIN, api_key, created: new Date() }));
    logger.log(`Successfully created user\n-> username: ${ADMIN}\n-> api_key: ${api_key}`);
  }

  logger.log("Successfully initialized database.");
};

export const close = () => {
  database.close();
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

export type GetMetadataQuery = Partial<Metadata> & { [USER_ID]: number };

export const getMetadata = (metadata: GetMetadataQuery) => {
  const query = prepareQuery(metadata);
  const sql = `
    SELECT ${metadataColumns.join(", ")}
    FROM ${METADATA}
    ${query}
  `;
  return queryMetadata(sql);
};

export const getAllMetadata = () => {
  const sql = `
    SELECT ${metadataColumns.join(", ")}
    FROM ${METADATA}
  `;
  return queryMetadata(sql);
};

export const getMetadataByCreatedDate = (greaterThanOrEqual: Date, lessThanOrEqual: Date) => {
  const sql = `
    SELECT ${metadataColumns.join(", ")}
    FROM ${METADATA}
    WHERE datetime(${CREATED}) >= ?
    AND datetime(${CREATED}) <= ?
  `;
  const gte = greaterThanOrEqual.toISOString();
  const lte = lessThanOrEqual.toISOString();
  return queryMetadata(sql, gte, lte);
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

const queryLabel = (sql: string, ...args: SQLQueryBindings[]) => {
  return database
    .prepare<Label, SQLQueryBindings[]>(sql)
    .all(...args)
    .map((l) => {
      const nullified: any = { ...l };
      Object.keys(labelSchema).forEach((c) => {
        if (!isDefined(nullified[c])) nullified[c] = null;
      });
      return new Label(nullified);
    });
};

export const getLabels = (user_id: number, metadata_id: number) => {
  const sql = `
    SELECT ${labelColumns.join(", ")}
    FROM ${LABEL}
    where ${USER_ID} = ?
    and ${METADATA_ID} = ?
  `;
  return queryLabel(sql, user_id, metadata_id);
};

export const insertLabels = (
  metadata_id: number | bigint,
  user_id: number,
  labelnames: string[]
) => {
  const values = labelnames
    .map((labelname) => `(${metadata_id}, ${user_id}, '${labelname}')`)
    .join(", ");

  const sql = `
    INSERT INTO ${LABEL} (
      ${METADATA_ID},
      ${USER_ID},
      ${LABELNAME}
    ) VALUES ${values}
  `;

  return database.exec(sql);
};

export const removeLabels = (metadata_id: number | bigint, user_id: number) => {
  const sql = `
    DELETE FROM ${LABEL}
    WHERE ${METADATA_ID} = ?
    AND ${USER_ID} = ?
  `;
  return database.prepare(sql).run(metadata_id, user_id);
};

export const getMetadataByLabel = (user_id: number, labelname: string) => {
  const selectColumns = metadataColumns.map((c) => `${METADATA}.${c} as ${c}`);
  const sql = `
    SELECT ${selectColumns.join(", ")}
    FROM ${METADATA}
    INNER JOIN ${LABEL}
    ON ${METADATA}.${ID} = ${LABEL}.${METADATA_ID}
    WHERE ${METADATA}.${USER_ID} = ?
    AND ${LABEL}.${LABELNAME} = ?
  `;
  return queryMetadata(sql, user_id, labelname);
};

export interface MetadataCountByLabel {
  labelname: string;
  metadata_count: number;
}

export const getMetadataCountByLabel = (user_id: number) => {
  const sql = `
  SELECT ${LABELNAME}, COUNT(UNIQUE(${METADATA_ID})) as metadata_count
  FROM ${LABEL}
  WHERE ${USER_ID} = ${user_id}
  GROUP BY ${LABELNAME}
  `;
  return database.prepare<MetadataCountByLabel, SQLQueryBindings[]>(sql).all();
};
