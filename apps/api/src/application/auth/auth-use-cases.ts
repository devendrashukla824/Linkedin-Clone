import bcrypt from "bcryptjs";
import type { AuthPayload, UserProfile } from "@linkedin-clone/shared";
import type { UserRepository } from "#src/domain/repositories/user-repository.js";
import { JwtService } from "#src/infrastructure/services/jwt-service.js";
import { AppError } from "#src/shared/errors/app-error.js";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  headline?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthUseCases {
  constructor(
    private readonly users: UserRepository,
    private readonly jwtService = new JwtService()
  ) {}

  async register(input: RegisterInput): Promise<AuthPayload> {
    const existingUser = await this.users.findByEmail(input.email);
    if (existingUser) {
      throw new AppError(409, "An account already exists with this email");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.create({
      name: input.name,
      email: input.email,
      passwordHash,
      headline: input.headline,
      contact: {
        email: input.email
      }
    });

    return this.toAuthPayload(user);
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    if (user.status === "suspended") {
      throw new AppError(403, "This account has been suspended");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, "Invalid email or password");
    }

    return this.toAuthPayload(user);
  }

  createProfile(user: NonNullable<Awaited<ReturnType<UserRepository["findByEmail"]>>>): UserProfile {
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
      skills: user.skills,
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

  private toAuthPayload(user: Awaited<ReturnType<UserRepository["findByEmail"]>>): AuthPayload {
    if (!user) {
      throw new AppError(500, "Unable to create auth payload");
    }

    const accessToken = this.jwtService.sign({ userId: user.id });
    const profile = this.createProfile(user);

    return { user: profile, accessToken };
  }
}
