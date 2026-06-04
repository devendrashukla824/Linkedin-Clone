import type { UserProfile } from "@linkedin-clone/shared";

export const DEMO_ACCESS_TOKEN = "demo-local-session";

export const demoUser: UserProfile = {
  id: "demo-user",
  role: "admin",
  status: "active",
  name: "Devendra Shukla",
  email: "devendrashukla824@gmail.com",
  headline: "Frontend developer",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",
  coverUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop",
  about:
    "Frontend developer focused on building clean, responsive user interfaces with React, Next.js and TypeScript. I enjoy turning product ideas into usable, polished web experiences.",
  location: "India",
  company: "ProNet",
  skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  experience: [
    {
      id: "demo-exp-1",
      title: "Frontend Developer",
      company: "ProNet",
      location: "Remote",
      startDate: "2025",
      isCurrent: true,
      description: "Building responsive profile, feed and authentication experiences for a professional networking platform."
    }
  ],
  education: [
    {
      id: "demo-edu-1",
      school: "Project Based Learning",
      degree: "Full Stack Web Development",
      field: "MERN and Next.js",
      startYear: "2024",
      endYear: "2026",
      description: "Focused on React, Node.js, MongoDB, authentication and production-style project structure."
    }
  ],
  contact: {
    email: "devendrashukla824@gmail.com",
    website: "https://portfolio.example.com",
    linkedIn: "https://linkedin.com/in/devendra-shukla",
    location: "India"
  },
  connectionsCount: 842,
  createdAt: new Date().toISOString()
};
