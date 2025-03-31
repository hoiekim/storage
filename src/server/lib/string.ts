export const decodeBase64 = (base64String: string) => {
  return Buffer.from(base64String, "base64").toString("utf-8");
};

export const encodeBase64 = (string: string) => {
  return Buffer.from(string).toString("base64");
};
