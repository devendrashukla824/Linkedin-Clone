import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import type { UpdateProfileInput, UserProfile } from "@linkedin-clone/shared";
import { z } from "zod";
import { MongoUserRepository } from "#src/infrastructure/repositories/mongo-user-repository.js";
import { CloudinaryUploadService } from "#src/infrastructure/services/cloudinary-upload-service.js";
import { AppError } from "#src/shared/errors/app-error.js";

const users = new MongoUserRepository();
const uploads = new CloudinaryUploadService();

const contactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  website: z.string().url().optional().or(z.literal("")),
  linkedIn: z.string().url().optional().or(z.literal("")),
  location: z.string().max(120).optional()
});

const experienceSchema = z.object({
  title: z.string().min(2).max(120),
  company: z.string().min(2).max(120),
  location: z.string().max(120).optional(),
  startDate: z.string().min(4),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().max(1200).optional()
});

const educationSchema = z.object({
  school: z.string().min(2).max(160),
  degree: z.string().min(2).max(160),
  field: z.string().max(160).optional(),
  startYear: z.string().max(12).optional(),
  endYear: z.string().max(12).optional(),
  description: z.string().max(1200).optional()
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  headline: z.string().max(160).optional(),
  about: z.string().max(2000).optional(),
  location: z.string().max(120).optional(),
  company: z.string().max(120).optional(),
  skills: z.array(z.string().min(1).max(60)).max(50).optional(),
  contact: contactSchema.optional(),
  experience: z.array(experienceSchema.extend({ id: z.string().min(1) })).optional(),
  education: z.array(educationSchema.extend({ id: z.string().min(1) })).optional()
});

export async function meController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    response.json({ success: true, data: toProfile(request.user) });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const payload = updateProfileSchema.parse(request.body) satisfies UpdateProfileInput;
    Object.assign(request.user, {
      ...payload,
      contact: {
        ...request.user.contact,
        ...payload.contact,
        email: payload.contact?.email || request.user.contact?.email || request.user.email
      }
    });

    const user = await users.save(request.user);
    response.json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateSkillsController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const payload = z.object({ skills: z.array(z.string().min(1).max(60)).max(50) }).parse(request.body);
    request.user.skills = [...new Set(payload.skills.map((skill) => skill.trim()).filter(Boolean))];
    const user = await users.save(request.user);
    response.json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function addExperienceController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const payload = experienceSchema.parse(request.body);
    request.user.experience = [{ id: randomUUID(), ...payload }, ...(request.user.experience ?? [])];
    const user = await users.save(request.user);
    response.status(201).json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateExperienceController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const payload = experienceSchema.partial().parse(request.body);
    const items = request.user.experience ?? [];
    const index = items.findIndex((item) => item.id === request.params.experienceId);
    if (index === -1) {
      throw new AppError(404, "Experience item not found");
    }

    items[index] = { ...items[index], ...payload };
    request.user.experience = items;
    const user = await users.save(request.user);
    response.json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function deleteExperienceController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    request.user.experience = (request.user.experience ?? []).filter((item) => item.id !== request.params.experienceId);
    const user = await users.save(request.user);
    response.json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function addEducationController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const payload = educationSchema.parse(request.body);
    request.user.education = [{ id: randomUUID(), ...payload }, ...(request.user.education ?? [])];
    const user = await users.save(request.user);
    response.status(201).json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateEducationController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const payload = educationSchema.partial().parse(request.body);
    const items = request.user.education ?? [];
    const index = items.findIndex((item) => item.id === request.params.educationId);
    if (index === -1) {
      throw new AppError(404, "Education item not found");
    }

    items[index] = { ...items[index], ...payload };
    request.user.education = items;
    const user = await users.save(request.user);
    response.json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function deleteEducationController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    request.user.education = (request.user.education ?? []).filter((item) => item.id !== request.params.educationId);
    const user = await users.save(request.user);
    response.json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function uploadAvatarController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user || !request.file) {
      throw new AppError(400, "Profile image is required");
    }

    const result = await uploads.uploadImage(request.file.buffer, "linkedin-clone/avatars");
    request.user.avatarUrl = result.secure_url;
    const user = await users.save(request.user);
    response.json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function uploadCoverController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user || !request.file) {
      throw new AppError(400, "Cover image is required");
    }

    const result = await uploads.uploadImage(request.file.buffer, "linkedin-clone/covers");
    request.user.coverUrl = result.secure_url;
    const user = await users.save(request.user);
    response.json({ success: true, data: toProfile(user) });
  } catch (error) {
    next(error);
  }
}

export async function suggestionsController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const suggestions = await users.listSuggestions(request.user.id, 8);
    response.json({
      success: true,
      data: suggestions.map((user) => ({
        id: user.id,
        name: user.name,
        headline: user.headline,
        avatarUrl: user.avatarUrl,
        mutualConnections: 0
      }))
    });
  } catch (error) {
    next(error);
  }
}

function toProfile(user: NonNullable<Request["user"]>): UserProfile {
  return {
    id: user.id,
    role: user.role ?? "user",
    status: user.status ?? "active",
    name: user.name,
    email: user.email,
    headline: user.headline,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    about: user.about,
    location: user.location,
    company: user.company,
    skills: user.skills ?? [],
    experience: user.experience ?? [],
    education: user.education ?? [],
    contact: {
      email: user.contact?.email || user.email,
      phone: user.contact?.phone,
      website: user.contact?.website,
      linkedIn: user.contact?.linkedIn,
      location: user.contact?.location || user.location
    },
    connectionsCount: user.connections.length,
    createdAt: user.createdAt.toISOString()
  };
}
