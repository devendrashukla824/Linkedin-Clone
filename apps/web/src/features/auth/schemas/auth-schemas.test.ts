import { loginSchema, registerSchema } from "@/features/auth/schemas/auth-schemas";

describe("auth schemas", () => {
  it("validates login input", () => {
    expect(loginSchema.safeParse({ email: "dev@example.com", password: "password123" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "invalid", password: "" }).success).toBe(false);
  });

  it("requires strong enough registration fields", () => {
    expect(
      registerSchema.safeParse({
        name: "Devendra Shukla",
        email: "dev@example.com",
        password: "password123",
        headline: "Frontend developer"
      }).success
    ).toBe(true);
    expect(registerSchema.safeParse({ name: "D", email: "bad", password: "short" }).success).toBe(false);
  });
});
