export const isString = (e: any) => typeof e === "string";
export const isNumber = (e: any) => typeof e === "number";
export const isDate = (e: any) => e instanceof Date;
export const isPotentialDate = (e: any) => !!new Date(e).getTime();
export const isNull = (e: any) => e === null;
export const isDefined = (e: any) => e !== undefined;
