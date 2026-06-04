import { Schema, model, type HydratedDocument } from "mongoose";
import type { UserEntity } from "#src/domain/entities/user.js";

export type UserDocument = HydratedDocument<UserEntity>;

const userSchema = new Schema<UserEntity>(
  {
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    headline: { type: String, default: "Open to professional opportunities" },
    avatarUrl: String,
    coverUrl: String,
    about: { type: String, default: "" },
    location: String,
    company: String,
    skills: { type: [String], default: [] },
    contact: {
      email: { type: String, default: "" },
      phone: String,
      website: String,
      linkedIn: String,
      location: String
    },
    experience: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          company: { type: String, required: true },
          location: String,
          startDate: { type: String, required: true },
          endDate: String,
          isCurrent: { type: Boolean, default: false },
          description: String
        }
      ],
      default: []
    },
    education: {
      type: [
        {
          id: { type: String, required: true },
          school: { type: String, required: true },
          degree: { type: String, required: true },
          field: String,
          startYear: String,
          endYear: String,
          description: String
        }
      ],
      default: []
    },
    connections: { type: [String], default: [] },
    followers: { type: [String], default: [] },
    following: { type: [String], default: [] },
    sentConnectionRequests: { type: [String], default: [] },
    receivedConnectionRequests: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const UserModel = model<UserEntity>("User", userSchema);
