import { createServer } from "node:http";
import { createApp } from "#src/app.js";
import { env } from "#src/config/env.js";
import { connectDatabase } from "#src/config/database.js";
import { createSocketServer } from "#src/interfaces/realtime/socket-server.js";

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const httpServer = createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
