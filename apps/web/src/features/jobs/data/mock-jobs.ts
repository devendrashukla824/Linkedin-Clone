import type { JobListing } from "@linkedin-clone/shared";
import { currentUser } from "@/features/feed/data/mock-feed";

export const mockJobs: JobListing[] = [
  {
    id: "job-1",
    title: "Frontend Developer",
    company: "TalentGrid",
    location: "Bengaluru, India",
    workplaceType: "Hybrid",
    jobType: "Full-time",
    experienceLevel: "Associate",
    salaryRange: "₹9L - ₹16L",
    description:
      "Build polished, responsive product surfaces for hiring teams. You will work with React, TypeScript and design systems to ship calm workflows for busy recruiters.",
    responsibilities: [
      "Build accessible React interfaces with reusable components",
      "Partner with design and backend teams on product workflows",
      "Improve performance, responsiveness and UI quality"
    ],
    requirements: [
      "2+ years building production React applications",
      "Strong TypeScript and CSS fundamentals",
      "Experience with REST APIs and product-oriented teams"
    ],
    skills: ["React", "TypeScript", "Tailwind CSS", "React Query"],
    postedBy: {
      id: "user-rohan",
      name: "Rohan Kapoor",
      headline: "Founder at TalentGrid"
    },
    applicantsCount: 48,
    viewsCount: 740,
    hasApplied: false,
    isSaved: true,
    canManage: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString()
  },
  {
    id: "job-2",
    title: "Backend Engineer",
    company: "FinAxis",
    location: "Remote, India",
    workplaceType: "Remote",
    jobType: "Full-time",
    experienceLevel: "Mid-Senior level",
    salaryRange: "₹18L - ₹28L",
    description:
      "Own services powering payments, reporting and compliance dashboards. This role is suited for engineers who enjoy reliable systems and clean APIs.",
    responsibilities: [
      "Design Node.js APIs and MongoDB data models",
      "Own observability, testing and production reliability",
      "Collaborate with frontend and platform engineers"
    ],
    requirements: ["4+ years backend experience", "Strong Node.js and database fundamentals", "Experience with auth and distributed systems"],
    skills: ["Node.js", "Express", "MongoDB", "JWT"],
    postedBy: {
      id: "user-kavya",
      name: "Kavya Nair",
      headline: "Data Scientist at FinAxis"
    },
    applicantsCount: 91,
    viewsCount: 1320,
    hasApplied: false,
    isSaved: false,
    canManage: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString()
  },
  {
    id: "job-3",
    title: "Product Designer",
    company: "ProNet Labs",
    location: "Mumbai, India",
    workplaceType: "On-site",
    jobType: "Contract",
    experienceLevel: "Associate",
    salaryRange: "₹80k - ₹1.2L / month",
    description:
      "Design a professional networking experience with dense information, clear actions and a polished mobile experience.",
    responsibilities: ["Prototype job and profile workflows", "Maintain component usage patterns", "Run design reviews with engineering"],
    requirements: ["Portfolio of shipped SaaS interfaces", "Strong interaction design judgment", "Comfort with Figma and design systems"],
    skills: ["Figma", "UX Research", "Design Systems"],
    postedBy: currentUser,
    applicantsCount: 12,
    viewsCount: 210,
    hasApplied: false,
    isSaved: false,
    canManage: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString()
  },
  {
    id: "job-4",
    title: "Software Engineering Intern",
    company: "CloudBridge",
    location: "Pune, India",
    workplaceType: "Hybrid",
    jobType: "Internship",
    experienceLevel: "Internship",
    description: "Join a small platform team building internal tools, dashboards and API integrations for operations teams.",
    responsibilities: ["Build small frontend features", "Write API integration tests", "Document implementation decisions"],
    requirements: ["Good JavaScript fundamentals", "Comfort with Git", "Curiosity and consistency"],
    skills: ["JavaScript", "Git", "APIs"],
    postedBy: {
      id: "user-aisha",
      name: "Aisha Khan",
      headline: "People Partner at CloudBridge"
    },
    applicantsCount: 128,
    viewsCount: 1840,
    hasApplied: false,
    isSaved: false,
    canManage: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString()
  }
];
