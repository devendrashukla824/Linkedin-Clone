import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";

const app = createApp();
let databaseReady: Promise<void> | null = null;

export default async function handler(request: any, response: any) {
  databaseReady ??= connectDatabase();
  await databaseReady;
  return app(request, response);
}
