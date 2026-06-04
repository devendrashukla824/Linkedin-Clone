import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3001",
    trace: "on-first-retry"
  },
  webServer: {
    command:
      "powershell -NoProfile -Command \"$env:NEXT_DIST_DIR='.next-e2e'; npm --workspace @linkedin-clone/web run dev -- -p 3001\"",
    reuseExistingServer: true,
    url: process.env.E2E_BASE_URL ? `${process.env.E2E_BASE_URL}/login` : "http://127.0.0.1:3001/login"
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } }
  ]
});
