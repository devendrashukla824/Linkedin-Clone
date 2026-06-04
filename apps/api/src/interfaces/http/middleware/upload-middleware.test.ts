import express from "express";
import request from "supertest";
import { errorMiddleware } from "#src/interfaces/http/middleware/error-middleware.js";
import { imageUpload, resumeUpload } from "#src/interfaces/http/middleware/upload-middleware.js";

function createUploadTestApp() {
  const app = express();
  app.post("/image", imageUpload.single("image"), (_request, response) => response.status(204).end());
  app.post("/resume", resumeUpload.single("resume"), (_request, response) => response.status(204).end());
  app.use(errorMiddleware);
  return app;
}

describe("upload middleware", () => {
  it("rejects non-image profile uploads", async () => {
    await request(createUploadTestApp())
      .post("/image")
      .attach("image", Buffer.from("not an image"), { filename: "avatar.txt", contentType: "text/plain" })
      .expect(400)
      .expect(({ body }) => {
        expect(body.success).toBe(false);
        expect(body.message).toBe("Image must be JPEG, PNG, WEBP, or GIF");
      });
  });

  it("accepts supported image uploads", async () => {
    await request(createUploadTestApp())
      .post("/image")
      .attach("image", Buffer.from("image"), { filename: "avatar.webp", contentType: "image/webp" })
      .expect(204);
  });

  it("rejects invalid resume uploads", async () => {
    await request(createUploadTestApp())
      .post("/resume")
      .attach("resume", Buffer.from("image"), { filename: "resume.png", contentType: "image/png" })
      .expect(400)
      .expect(({ body }) => {
        expect(body.success).toBe(false);
        expect(body.message).toBe("Resume must be a PDF or DOCX file");
      });
  });

  it("accepts PDF resume uploads", async () => {
    await request(createUploadTestApp())
      .post("/resume")
      .attach("resume", Buffer.from("%PDF-1.7"), { filename: "resume.pdf", contentType: "application/pdf" })
      .expect(204);
  });
});
