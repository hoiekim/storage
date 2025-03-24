import { test, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import { DATA_PATH, DATA_TESTING_PATH, database, getFilePath, startServer } from "../src/server";
import { Server } from "http";
import { randomUUID } from "crypto";

if (DATA_PATH !== DATA_TESTING_PATH) {
  throw new Error(
    "Testing environment is not configured correctly. Is preload script correctly executed?"
  );
}

const { PORT } = process.env;

let server: Server;

beforeAll(() => {
  server = startServer();
});

test('should return "Unauthorized" message', async () => {
  const response = await fetch(`localhost:${PORT}`);
  const rJson = await response.json();
  expect(rJson.message).toBe("Unauthorized: Invalid API key");
  expect(response.status).toBe(401);
});

test('should return "OK" message', async () => {
  const response = await fetch(`localhost:${PORT}/?api_key=admin`);
  const rJson = await response.json();
  expect(rJson.message).toBe("OK");
  expect(response.status).toBe(200);
});

test("should upload file", async () => {
  const formData = new FormData();
  formData.append("file", new Blob(["1", "2", "3"], { type: "image/png" }), "testing-file.png");
  const itemId = randomUUID();
  const requestPath = `localhost:${PORT}/file/${itemId}?api_key=admin`;
  const response = await fetch(requestPath, { method: "POST", body: formData });
  const rJson = await response.json();
  expect(rJson.message).toBe("File uploaded successfully.");
  expect(response.status).toBe(200);

  const { user_id, filekey } = rJson.body;
  const filePath = getFilePath(user_id, filekey);
  expect(fs.existsSync(filePath)).toBeTrue();
});

test("should reject file upload", async () => {
  const formData = new FormData();
  formData.append("file", new Blob(["1", "2", "3"], { type: "text/plain" }), "testing-file.text");
  const itemId = randomUUID();
  const requestPath = `localhost:${PORT}/file/${itemId}?api_key=admin`;
  const response = await fetch(requestPath, { method: "POST", body: formData });
  const rJson = await response.json();
  expect(rJson.message).toBe("Error: Invalid file type. Only photos and videos are allowed.");
  expect(response.status).toBe(400);
});

afterAll(() => {
  database.close();
  server.close();
  fs.rmSync(DATA_TESTING_PATH, { force: true, recursive: true });
});
