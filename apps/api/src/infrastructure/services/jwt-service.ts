import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "#src/config/env.js";

export interface JwtPayload {
  userId: string;
}

export class JwtService {
  sign(payload: JwtPayload) {
    const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  verify(token: string) {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  }
}
