import { Schema, model, type HydratedDocument } from "mongoose";
import type { PostEntity } from "#src/domain/entities/post.js";

export type PostDocument = HydratedDocument<PostEntity>;

const postSchema = new Schema<PostEntity>(
  {
    authorId: { type: String, ref: "User", required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    imageUrl: String,
    likes: { type: [String], default: [] },
    shares: { type: [String], default: [] },
    status: { type: String, enum: ["active", "hidden", "flagged"], default: "active", index: true },
    reportsCount: { type: Number, default: 0 },
    comments: {
      type: [
        {
          id: { type: String, required: true },
          userId: { type: String, required: true, index: true },
          username: { type: String, required: true },
          profileImage: String,
          commentText: { type: String, required: true, maxlength: 1200 },
          createdAt: { type: String, required: true },
          updatedAt: String
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

postSchema.virtual("author", {
  ref: "User",
  localField: "authorId",
  foreignField: "_id",
  justOne: true
});

postSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const record = ret as unknown as Record<string, unknown>;
    record.id = record._id?.toString();
    delete record._id;
    delete record.__v;
  }
});

export const PostModel = model<PostEntity>("Post", postSchema);
