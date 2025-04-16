import { test, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import { randomUUID } from "crypto";
import { OnSuccessPayload, Upload as TusUpload } from "tus-js-client";
import {
  DATA_PATH,
  DATA_TESTING_PATH,
  database,
  decodeBase64,
  getFilePath,
  Server,
  stringifyUploadMetdata,
} from "../src/server";

if (DATA_PATH !== DATA_TESTING_PATH) {
  throw new Error(
    "Testing environment is not configured correctly. Is preload script correctly executed?"
  );
}

const server = new Server();
const { port } = server;

beforeAll(server.start);

const host = `http://localhost:${port}`;
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

test("should successfully upload file", async () => {
  const blob = new Blob(["1", "2", "3"], { type: "image/png" });
  const filename = `${randomUUID()}.png`;
  const itemId = randomUUID();
  const postRequestPath = `${host}/tus`;
  const uploadMetadataString = stringifyUploadMetdata({ filename, itemId });

  const postResponse = await fetch(postRequestPath, {
    method: "POST",
    headers: {
      Authorization: "Bearer admin",
      "Tus-Resumable": "1.0.0",
      "Upload-Length": "3",
      "Upload-Metadata": uploadMetadataString,
    },
  });

  expect(postResponse.ok).toBeTrue();

  const uploadUrl = postResponse.headers.get("Location")!;
  expect(uploadUrl).toBeString();

  const firstPatchSize = blob.size - 1;

  const patchResponse1 = await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer admin",
      "Tus-Resumable": "1.0.0",
      "Content-Type": "application/offset+octet-stream",
      "Upload-Offset": "0",
    },
    body: blob.slice(0, firstPatchSize),
  });

  let uploadOffset = +(patchResponse1.headers.get("upload-offset") || 0);
  expect(uploadOffset).toBe(firstPatchSize);

  const patchResponse2 = await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer admin",
      "Tus-Resumable": "1.0.0",
      "Content-Type": "application/offset+octet-stream",
      "Upload-Offset": uploadOffset.toString(),
    },
    body: blob.slice(uploadOffset, blob.size),
  });

  const pathComponents = uploadUrl.split("/");
  const lastPath = pathComponents[pathComponents.length - 1];
  const uploadId = decodeBase64(lastPath.split("?")[0]);

  expect(patchResponse2.status).toBe(204);

  uploadOffset = +(patchResponse2.headers.get("upload-offset") || 0);
  expect(uploadOffset).toBe(blob.size);

  const user = database.getUser({ api_key: "admin" })[0];
  const filePath = getFilePath(user.id, uploadId);
  expect(fs.existsSync(filePath)).toBeTrue();

  const metadata = database.getMetadata({ filekey: uploadId })[0];
  expect(metadata.filename).toBe(filename);
  expect(metadata.item_id).toBe(itemId);
});

test("should reject file upload", async () => {
  const filename = `${randomUUID()}.txt`;
  const postRequestPath = `${host}/tus`;
  const uploadMetadataString = stringifyUploadMetdata({ filename });

  const response = await fetch(postRequestPath, {
    method: "POST",
    headers: {
      Authorization: "Bearer admin",
      "Tus-Resumable": "1.0.0",
      "Upload-Length": "3",
      "Upload-Metadata": uploadMetadataString,
    },
  });

  expect(response.status).toBe(500);
  expect(response.headers.get("Location")).toBeNull();
  const responseText = await response.text();
  expect(responseText).toBe(
    "Something went wrong with that request\nInvalid request: itemId is required\n"
  );
});

test("should successfully upload file using tus client library", async () => {
  const buffer = Buffer.from("123");
  const filename = `${randomUUID()}.txt`;
  const itemId = randomUUID();

  const response = await new Promise<OnSuccessPayload>((res, rej) => {
    const upload = new TusUpload(buffer, {
      endpoint: `${host}/tus`,
      headers: { Authorization: "Bearer admin" },
      metadata: { filename, itemId },
      chunkSize: 1,
      onSuccess: res,
    });
    upload.start();
  });

  const pathComponents = response.lastResponse.getUnderlyingObject().url.split("/");
  const lastPath = pathComponents[pathComponents.length - 1];
  const uploadId = decodeBase64(lastPath.split("?")[0]);

  const user = database.getUser({ api_key: "admin" })[0];
  const filePath = getFilePath(user.id, uploadId);
  expect(fs.existsSync(filePath)).toBeTrue();

  const metadata = database.getMetadata({ filekey: uploadId })[0];
  expect(metadata.filename).toBe(filename);
  expect(metadata.item_id).toBe(itemId);
});

afterAll(() => {
  database.close();
  server.close();
  fs.rmSync(DATA_TESTING_PATH, { force: true, recursive: true });
});
