import { isNull, isNumber, isString } from "server";
import { METADATA, ID, METADATA_ID, LABELNAME, USER_ID, USER } from "./common";

export class Label {
  id: number;
  metadata_id: number;
  user_id: number;
  labelname: string;

  constructor(l: Label) {
    Label.assertType(l);
    this.id = l.id;
    this.metadata_id = l.metadata_id;
    this.user_id = l.user_id;
    this.labelname = l.labelname;
  }

  static assertType = (o: any, skip: string[] = []) => {
    if (typeof o !== "object" || isNull(o)) {
      throw new Error(`Input is not a valid object: ${o}`);
    }

    type Checker = { [x in keyof Label]: (e: any) => boolean };
    const checker: Checker = {
      id: isNumber,
      metadata_id: isNumber,
      user_id: isNumber,
      labelname: isString,
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

export type LabelSchema = { [k in keyof Label]: string };
export const labelSchema: LabelSchema = {
  [ID]: "INTEGER PRIMARY KEY",
  [METADATA_ID]: "INTEGER NOT NULL",
  [USER_ID]: "INTEGER NOT NULL",
  [LABELNAME]: "TEXT NOT NULL",
};

export const labelConstraints = [
  `FOREIGN KEY(${METADATA_ID}) REFERENCES ${METADATA}(${ID})`,
  `FOREIGN KEY(${USER_ID}) REFERENCES ${USER}(${ID})`,
];

export const labelColumns = Object.keys(labelSchema);
