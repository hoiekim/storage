import { v4 as uuidv4 } from "uuid";
import { User, database, isError } from "./server";

const main = () => {
  const api_key = uuidv4();
  let username = "";
  process.argv.forEach((e, i, array) => {
    if (e === "--username") username = array[i + 1];
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
