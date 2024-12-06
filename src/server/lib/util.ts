export const isString = (e: any): e is string => typeof e === "string";
export const isNumber = (e: any): e is number => typeof e === "number";
export const isDate = (e: any): e is Date => e instanceof Date;
export const isPotentialDate = (e: any): e is any => !!new Date(e).getTime();
export const isNull = (e: any): e is null => e === null;
export const isDefined = (e: any): e is any => e !== undefined;
export const isError = (e: any): e is Error => e instanceof Error;
