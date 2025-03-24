import { randomUUID } from "crypto";
import { User, database, isError } from "./server";

const main = () => {
  let api_key: string = randomUUID();
  let username = "";
  process.argv.forEach((e, i, array) => {
    if (e === "--username") username = array[i + 1];
    if (e === "--api-key") api_key = array[i + 1];
  });
  if (username) {
    try {
      database.insertUser(new User({ id: -1, username, api_key, created: new Date() }));
      console.log(`Successfully created user\n-> username: ${username}\n-> api_key: ${api_key}`);
    } catch (error: any) {
      if (isError(error)) console.error("Failed:", error.message);
      else console.error("Failed:", error);
    }
  } else {
    console.error("Failed: No --username is specified");
  }
};

main();
