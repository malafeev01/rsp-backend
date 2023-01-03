import winston from "winston";
import mongoose from "mongoose";
import http from "http";

import { logger, app, CONFIG } from "./app.js";

export const server = http.createServer(app);

//Establishing MongoDB connection
mongoose.set("strictQuery", true);
mongoose
  .connect(`mongodb://${CONFIG.MONGO_DB_HOST}:${CONFIG.MONGO_DB_PORT}/rsp`)
  .then(() => logger.info("[mongoose] Connected to DB"))
  .catch((err) => logger.error("[mongoose] Could not connect to DB"));

server.listen(CONFIG.SERVER_PORT, () => logger.info("Server has been started"));
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
