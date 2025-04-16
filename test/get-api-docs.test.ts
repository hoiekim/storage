import { test, expect } from "bun:test";
import { getApiDocs } from "../src/get-api-docs";

test("getApiDocs should return API docs", async () => {
  const docs = getApiDocs();
  expect(docs.length).toBeGreaterThan(0);
});
