import path from "path";
import fs from "fs";

const { ENVIRONMENT } = process.env;
export const isTesting = ENVIRONMENT === "testing";

const PROJECT_ROOT_PATH = path.join(__dirname, "../../..");

export const DATA_TESTING_PATH = path.join(PROJECT_ROOT_PATH, "data.testing");
export const DATA_PATH = isTesting ? DATA_TESTING_PATH : path.join(PROJECT_ROOT_PATH, "data");
export const TEMP_PATH = path.join(DATA_PATH, "temp");
export const FILES_PATH = path.join(DATA_PATH, "files");
export const DB_PATH = path.join(DATA_PATH, ".db");

if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH);
if (!fs.existsSync(FILES_PATH)) fs.mkdirSync(FILES_PATH);
if (!fs.existsSync(TEMP_PATH)) fs.mkdirSync(TEMP_PATH);

export const getUserFolderPath = (user_id: number) => {
  const folder = path.join(FILES_PATH, user_id.toString());
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  return folder;
};

export const getFilePath = (user_id: number, filekey: string) => {
  return path.join(getUserFolderPath(user_id), filekey);
};

export const getThumbnailPath = (user_id: number, filekey: string) => {
  const thumbnailsFolder = path.join(getUserFolderPath(user_id), "thumbnails");
  if (!fs.existsSync(thumbnailsFolder)) fs.mkdirSync(thumbnailsFolder);
  return path.join(thumbnailsFolder, filekey);
};
