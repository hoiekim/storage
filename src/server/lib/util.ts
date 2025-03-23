export const isString = (e: any): e is string => typeof e === "string";
export const isNumber = (e: any): e is number => typeof e === "number";
export const isDate = (e: any): e is Date => e instanceof Date;

export type DateInit = number | string | Date;
export const isPotentialDate = (e: any): e is DateInit => !Number.isNaN(new Date(e).getTime());

export const isNull = (e: any): e is null => e === null;
export const isDefined = <T>(e: T | undefined): e is T => e !== undefined;
export const isError = (e: any): e is Error => e instanceof Error;
