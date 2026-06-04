import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "#src/config/cloudinary.js";
import { env } from "#src/config/env.js";

export class CloudinaryUploadService {
  async uploadImage(buffer: Buffer, folder: string) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      });

      stream.end(buffer);
    });
  }

  async uploadFile(buffer: Buffer, folder: string, originalName: string) {
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      return new Promise<Pick<UploadApiResponse, "secure_url" | "original_filename">>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            allowed_formats: ["pdf", "docx"],
            folder,
            resource_type: "auto",
            use_filename: true,
            filename_override: path.basename(originalName)
          },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("Cloudinary upload failed"));
              return;
            }
            resolve({ secure_url: result.secure_url, original_filename: result.original_filename });
          }
        );

        stream.end(buffer);
      });
    }

    if (env.NODE_ENV === "production") {
      throw new Error("Cloudinary credentials are required for production file uploads");
    }

    const extension = path.extname(originalName).toLowerCase();
    const fileName = `${randomUUID()}${extension}`;
    const uploadDir = path.resolve("uploads", "resumes");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
    return { secure_url: `/uploads/resumes/${fileName}`, original_filename: originalName };
  }
}
