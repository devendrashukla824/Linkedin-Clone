import { Schema, model, type HydratedDocument } from "mongoose";
import type { RepostEntity } from "#src/domain/entities/repost.js";

export type RepostDocument = HydratedDocument<RepostEntity>;

const repostSchema = new Schema<RepostEntity>(
  {
    postId: { type: String, ref: "Post", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    caption: { type: String, trim: true, maxlength: 1200 }
  },
  { timestamps: true }
);

repostSchema.index({ postId: 1, userId: 1, createdAt: -1 });

repostSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true
});

repostSchema.virtual("post", {
  ref: "Post",
  localField: "postId",
  foreignField: "_id",
  justOne: true
});

repostSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const record = ret as unknown as Record<string, unknown>;
    record.id = record._id?.toString();
    delete record._id;
    delete record.__v;
  }
});

export const RepostModel = model<RepostEntity>("Repost", repostSchema);
