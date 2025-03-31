import { test, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import {
  DATA_PATH,
  DATA_TESTING_PATH,
  database,
  getFilePath,
  Server,
  stringifyUploadMetdata,
} from "../src/server";
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
  const testingStartTime = new Date();
  const blob = new Blob(["1", "2", "3"], { type: "image/png" });
  const filename = "testing-file-tus.png";
  const itemId = randomUUID();
  const postRequestPath = `${host}/tus${authParam}`;
  const uploadMetadataString = stringifyUploadMetdata({ filename, itemId });

  const postResponse = await fetch(postRequestPath, {
    method: "POST",
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Length": "3",
      "Upload-Metadata": uploadMetadataString,
    },
  });

  if (!postResponse.ok) throw new Error(`Failed to create upload: ${postResponse.status}`);

  const uploadUrl = postResponse.headers.get("Location");
  if (!uploadUrl) throw new Error("No upload URL returned");

  const patchResponse = await fetch(`${uploadUrl}${authParam}`, {
    method: "PATCH",
    headers: {
      "Tus-Resumable": "1.0.0",
      "Content-Type": "application/offset+octet-stream",
      "Upload-Offset": "0",
    },
    body: blob,
  });

  expect(patchResponse.status).toBe(201);
  const responseJson = await patchResponse.json();
  const { message, body } = responseJson;
  const responseTime = new Date();
  expect(message).toBe("Upload complete");
  const { user_id, filekey, filename: responseFilename, item_id, created, uploaded } = body;
  const filePath = getFilePath(user_id, filekey);
  expect(fs.existsSync(filePath)).toBeTrue();
  expect(responseFilename).toBe(filename);
  expect(item_id).toBe(itemId);
  expect(new Date(created!).getTime()).toBeGreaterThan(testingStartTime.getTime());
  expect(new Date(created!).getTime()).toBeLessThan(responseTime.getTime());
  expect(new Date(uploaded).getTime()).toBeGreaterThan(testingStartTime.getTime());
  expect(new Date(uploaded).getTime()).toBeLessThan(responseTime.getTime());
});

afterAll(() => {
  database.close();
  server.close();
  fs.rmSync(DATA_TESTING_PATH, { force: true, recursive: true });
});
