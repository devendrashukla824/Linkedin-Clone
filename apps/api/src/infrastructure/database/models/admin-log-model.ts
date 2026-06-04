import { Schema, model, type HydratedDocument } from "mongoose";
import type { AdminActivityLog } from "@linkedin-clone/shared";

export type AdminLogDocument = HydratedDocument<AdminActivityLog>;

const adminLogSchema = new Schema<AdminActivityLog>(
  {
    actor: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String, required: true },
    createdAt: { type: String, required: true }
  },
  { timestamps: false }
);

export const AdminLogModel = model<AdminActivityLog>("AdminLog", adminLogSchema);
