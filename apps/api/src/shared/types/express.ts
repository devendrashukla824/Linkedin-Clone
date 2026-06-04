import type { UserDocument } from "#src/infrastructure/database/models/user-model.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
