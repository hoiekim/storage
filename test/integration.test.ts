import { test, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import { DATA_PATH, DATA_TESTING_PATH, database, getFilePath, Server } from "../src/server";
import { randomUUID } from "crypto";

if (DATA_PATH !== DATA_TESTING_PATH) {
  throw new Error(
    "Testing environment is not configured correctly. Is preload script correctly executed?"
  );
}

const server = new Server();
const { port } = server;

beforeAll(server.start);

const host = `localhost:${port}`;
const authParam = "?api_key=admin";

test('should return "Unauthorized" message', async () => {
  const response = await fetch(host);
  const rJson = await response.json();
  expect(rJson.message).toBe("Unauthorized: Invalid API key");
  expect(response.status).toBe(401);
});

test('should return "OK" message', async () => {
  const response = await fetch(`${host}/${authParam}`);
  const rJson = await response.json();
  expect(rJson.message).toBe("OK");
  expect(response.status).toBe(200);
});

test("should upload file (multer)", async () => {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob(["1", "2", "3"], { type: "image/png" }),
    "testing-file-multer.png"
  );
  const itemId = randomUUID();
  const requestPath = `${host}/file/${itemId}${authParam}`;
  const response = await fetch(requestPath, { method: "POST", body: formData });
  const rJson = await response.json();
  expect(rJson.message).toBe("File uploaded successfully.");
  expect(response.status).toBe(200);

  const { user_id, filekey } = rJson.body;
  const filePath = getFilePath(user_id, filekey);
  expect(fs.existsSync(filePath)).toBeTrue();
});

test("should reject file upload (multer)", async () => {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob(["1", "2", "3"], { type: "text/plain" }),
    "testing-file-multer.text"
  );
  const itemId = randomUUID();
  const requestPath = `${host}/file/${itemId}${authParam}`;
  const response = await fetch(requestPath, { method: "POST", body: formData });
  const rJson = await response.json();
  expect(rJson.message).toBe("Error: Invalid file type. Only photos and videos are allowed.");
  expect(response.status).toBe(400);
});

test("should upload file (tus)", async () => {
  const blob = new Blob(["1", "2", "3"], { type: "image/png" });

  const itemId = randomUUID();
  const postRequestPath = `${host}/tus/${itemId}${authParam}`;
  const postResponse = await fetch(postRequestPath, {
    method: "POST",
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Length": "3",
      "Upload-Metadata": `filename ${Buffer.from("testing-file-tus.png").toString("base64")}`,
    },
  });

  if (!postResponse.ok) {
    throw new Error(`Failed to create upload: ${postResponse.status}`);
  }

  const uploadUrl = postResponse.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("No upload URL returned");
  }

  const patchResponse = await fetch(`${uploadUrl}${authParam}`, {
    method: "PATCH",
    headers: {
      "Tus-Resumable": "1.0.0",
      "Content-Type": "application/offset+octet-stream",
      "Upload-Offset": "0",
      "item-id": "a1b2c3",
    },
    body: blob,
  });

  expect(patchResponse.status).toBe(201);
  const rJson = await patchResponse.json();
  expect(rJson.message).toBe("Upload complete");

  const { user_id, filekey } = rJson.body;
  const filePath = getFilePath(user_id, filekey);
  expect(fs.existsSync(filePath)).toBeTrue();
});

afterAll(() => {
  database.close();
  server.close();
  fs.rmSync(DATA_TESTING_PATH, { force: true, recursive: true });
});
