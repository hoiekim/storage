import { randomUUID } from "crypto";
import { User, database, isError, logger } from "./server";

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
      logger.log(`Successfully created user\n-> username: ${username}\n-> api_key: ${api_key}`);
    } catch (error: any) {
      if (isError(error)) logger.error("Failed:", error.message);
      else logger.error("Failed:", error);
    }
  } else {
    logger.error("Failed: No --username is specified");
  }
};

if (require.main === module) {
  main();
}
