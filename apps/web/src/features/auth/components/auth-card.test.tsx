import { render, screen } from "@testing-library/react";
import { AuthCard } from "@/features/auth/components/auth-card";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() })
}));

jest.mock("@/features/auth/hooks/use-auth", () => ({
  useLoginMutation: () => ({ isPending: false, mutate: jest.fn() }),
  useRegisterMutation: () => ({ isPending: false, mutate: jest.fn() })
}));

describe("AuthCard", () => {
  it("renders the login form and demo sign-in action", () => {
    render(<AuthCard mode="login" />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with demo account" })).toBeInTheDocument();
  });

  it("renders the registration form", () => {
    render(<AuthCard mode="register" />);

    expect(screen.getByText("Create your profile")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Full name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Professional headline")).toBeInTheDocument();
  });
});
