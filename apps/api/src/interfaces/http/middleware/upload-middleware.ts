import multer from "multer";
import { AppError } from "#src/shared/errors/app-error.js";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const resumeTypes = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!imageTypes.has(file.mimetype)) {
      callback(new AppError(400, "Image must be JPEG, PNG, WEBP, or GIF"));
      return;
    }
    callback(null, true);
  }
});

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!resumeTypes.has(file.mimetype)) {
      callback(new AppError(400, "Resume must be a PDF or DOCX file"));
      return;
    }
    callback(null, true);
  }
});
