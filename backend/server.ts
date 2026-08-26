import "dotenv/config";
import { checkDbConnection } from "./db.js";
import { winstonLogger } from "./src/util/logger.js";
import { app } from "./src/app.js";

// load environment vars
const deployEnv = process.env.npm_lifecycle_event;
const BACKEND_PORT = process.env.BACKEND_PORT || 3000;

checkDbConnection()
  .then(() => {
    app.listen(BACKEND_PORT, () => {
      winstonLogger.info("Server listening at http://localhost:3000");
      winstonLogger.info(`Target environment: ${deployEnv}`);
    });
  })
  .catch((err) => {
    winstonLogger.info("Failed to connect to the database", { err });
    process.exit(1);
  });
