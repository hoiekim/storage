import { isDate, isNull, isNumber, isPotentialDate, isString } from "server";
import { CREATED, ID, USERNAME, API_KEY } from "./common";

export class User {
  id: number;
  username: string;
  api_key: string;
  created: Date;

  constructor(u: User) {
    User.assertType(u);
    this.id = u.id;
    this.username = u.username;
    this.api_key = u.api_key;
    this.created = new Date(u.created);
  }

  static assertType = (o: any, skip: string[] = []) => {
    if (typeof o !== "object" || isNull(o)) {
      throw new Error(`Input is not a valid object: ${o}`);
    }

    type Checker = { [x in keyof User]: (e: any) => boolean };
    const checker: Checker = {
      id: isNumber,
      username: isString,
      api_key: isString,
      created: (e) => isPotentialDate(e),
    };

    const errors = Object.entries(checker).reduce((a, [k, check]) => {
      if (skip.includes(k) || check(o[k])) return a;
      else a.push(`${k}: ${o[k]} (${typeof o[k]})`);
      return a;
    }, new Array<string>());

    if (errors.length) {
      throw new Error(`There are ${errors.length} wrong type(s):\n${errors.join("\n")}`);
    }
  };
}

export type UserSchema = { [k in keyof User]: string };
export const userSchema: UserSchema = {
  [ID]: "INTEGER NOT NULL PRIMARY KEY",
  [USERNAME]: "TEXT NOT NULL UNIQUE",
  [API_KEY]: "TEXT NOT NULL UNIQUE",
  [CREATED]: "TEXT NOT NULL",
};
