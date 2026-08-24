import "dotenv/config";
import { checkDbConnection } from "./db.js";
import { winstonLogger } from "./src/util/logger.js";
import { app } from "./src/app.js";

// load environment vars
const deployEnv = process.env.NODE_ENV || "dev";

checkDbConnection()
  .then(() => {
    app.listen(3000, () => {
      winstonLogger.info("Server listening at http://localhost:3000");
      winstonLogger.info(`Target environment: ${deployEnv}`);
    });
  })
  .catch((err) => {
    winstonLogger.error("Failed to connect to the database", { err });
    process.exit(1);
  });
