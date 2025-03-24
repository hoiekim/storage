export type LogLevel = "debug" | "log" | "warn" | "error";

export const getLogger = (level?: LogLevel) => {
  const _level = level || process.env.ENVIRONMENT === "testing" ? "error" : "log";
  const rank = ["debug", "log", "warn", "error"].indexOf(_level);
  const debug = rank <= 0 ? console.debug : () => {};
  const log = rank <= 1 ? console.log : () => {};
  const warn = rank <= 2 ? console.warn : () => {};
  const error = console.error;
  return { debug, log, warn, error };
};

export const logger = getLogger();
