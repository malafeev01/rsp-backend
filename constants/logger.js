import { format } from "winston";

export const LOGGER_FORMAT = format.combine(
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.SSS",
  }),
  format.printf(
    (info) =>
      `${info.timestamp}\t[${info.level.toUpperCase()}]\t${info.message}`
  )
);
