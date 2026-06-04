import type { Express } from "express";

let appReady: Promise<Express> | null = null;

function sendJson(response: any, statusCode: number, body: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

function getPathname(request: any) {
  const host = request.headers?.host ?? "localhost";
  return new URL(request.url ?? "/", `https://${host}`).pathname;
}

async function getApp() {
  appReady ??= (async () => {
    const [{ createApp }, { connectDatabase }] = await Promise.all([
      import("../src/app.js"),
      import("../src/config/database.js")
    ]);

    const app = createApp();
    await connectDatabase();
    return app;
  })();

  return appReady;
}

export default async function handler(request: any, response: any) {
  const pathname = getPathname(request);

  if (pathname === "/" || pathname === "/health") {
    return sendJson(response, 200, {
      success: true,
      data: {
        name: "LinkedIn Clone API",
        status: "ok",
        runtime: "vercel-serverless"
      }
    });
  }

  try {
    const app = await getApp();
    return app(request, response);
  } catch (error) {
    appReady = null;
    const message = error instanceof Error ? error.message : "Unknown API startup error";

    return sendJson(response, 500, {
      success: false,
      error:
        "API runtime startup failed. Check Vercel Environment Variables: MONGODB_URI, JWT_SECRET, CLIENT_URL, and Cloudinary keys if uploads are enabled.",
      details: process.env.NODE_ENV === "production" ? undefined : message
    });
  }
}
