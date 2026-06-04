import { Router } from "express";
import {
  addEducationController,
  addExperienceController,
  deleteEducationController,
  deleteExperienceController,
  meController,
  suggestionsController,
  updateEducationController,
  updateExperienceController,
  updateProfileController,
  updateSkillsController,
  uploadAvatarController,
  uploadCoverController
} from "#src/interfaces/http/controllers/profile-controller.js";
import { authMiddleware } from "#src/interfaces/http/middleware/auth-middleware.js";
import { imageUpload } from "#src/interfaces/http/middleware/upload-middleware.js";

export const profileRoutes = Router();

profileRoutes.use(authMiddleware);
profileRoutes.get("/me", meController);
profileRoutes.patch("/me", updateProfileController);
profileRoutes.put("/me/skills", updateSkillsController);
profileRoutes.post("/me/avatar", imageUpload.single("image"), uploadAvatarController);
profileRoutes.post("/me/cover", imageUpload.single("image"), uploadCoverController);
profileRoutes.post("/me/experience", addExperienceController);
profileRoutes.patch("/me/experience/:experienceId", updateExperienceController);
profileRoutes.delete("/me/experience/:experienceId", deleteExperienceController);
profileRoutes.post("/me/education", addEducationController);
profileRoutes.patch("/me/education/:educationId", updateEducationController);
profileRoutes.delete("/me/education/:educationId", deleteEducationController);
profileRoutes.get("/suggestions", suggestionsController);
