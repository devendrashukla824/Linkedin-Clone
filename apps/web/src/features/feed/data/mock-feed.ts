import type { ConnectionSuggestion, FeedPost, UserProfile } from "@linkedin-clone/shared";

export const currentUser: UserProfile = {
  id: "u_1",
  name: "Aarav Sharma",
  headline: "Product Designer at NovaCloud",
  email: "aarav@example.com",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",
  coverUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop",
  about: "Product designer building practical systems for growing teams.",
  location: "Bengaluru, India",
  company: "NovaCloud",
  skills: ["Product Strategy", "UX Research", "Design Systems"],
  experience: [
    {
      id: "seed-exp-1",
      title: "Product Designer",
      company: "NovaCloud",
      location: "Bengaluru, India",
      startDate: "2024",
      isCurrent: true,
      description: "Designing product workflows and internal collaboration systems."
    }
  ],
  education: [
    {
      id: "seed-edu-1",
      school: "National Institute of Design",
      degree: "Bachelor of Design",
      field: "Interaction Design",
      startYear: "2019",
      endYear: "2023"
    }
  ],
  contact: {
    email: "aarav@example.com",
    website: "https://aarav.example.com",
    linkedIn: "https://linkedin.com/in/aarav-sharma",
    location: "Bengaluru, India"
  },
  connectionsCount: 1842,
  createdAt: "2025-04-12T00:00:00.000Z"
};

export const feedPosts: FeedPost[] = [
  {
    id: "p_1",
    author: {
      id: "u_2",
      name: "Meera Iyer",
      headline: "Engineering Manager | Platform Reliability",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces"
    },
    body:
      "Scaling a product is less about adding more process and more about making the right work visible. Our team moved from weekly status decks to live decision logs, and the quality of discussion changed overnight.",
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=720&fit=crop",
    likesCount: 138,
    commentsCount: 24,
    sharesCount: 12,
    hasLiked: false,
    canDelete: false,
    comments: [
      {
        id: "c_1",
        userId: "u_4",
        username: "Kavya Nair",
        profileImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=160&h=160&fit=crop&crop=faces",
        commentText: "The decision log idea is excellent. It makes context searchable instead of trapped in meetings.",
        createdAt: "2026-05-30T09:12:00.000Z",
        canEdit: false,
        canDelete: false
      }
    ],
    createdAt: "2026-05-30T08:12:00.000Z"
  },
  {
    id: "p_2",
    author: {
      id: "u_3",
      name: "Rohan Kapoor",
      headline: "Founder at TalentGrid",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces"
    },
    body:
      "Hiring update: we are opening frontend, backend and product roles for people who enjoy building calm tools for busy teams. Strong fundamentals, ownership and curiosity matter more than a perfect keyword match.",
    likesCount: 212,
    commentsCount: 41,
    sharesCount: 18,
    hasLiked: true,
    canDelete: false,
    comments: [],
    createdAt: "2026-05-29T15:45:00.000Z"
  },
  {
    id: "p_3",
    author: {
      id: "u_7",
      name: "Ananya Sen",
      headline: "UX Researcher | B2B SaaS",
      avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=160&h=160&fit=crop&crop=faces"
    },
    body:
      "A small research win from this week: asking teams what they stopped doing after a product launch revealed more workflow truth than the launch metrics alone.",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=720&fit=crop",
    likesCount: 89,
    commentsCount: 11,
    sharesCount: 5,
    hasLiked: false,
    canDelete: false,
    comments: [],
    createdAt: "2026-05-28T12:20:00.000Z"
  },
  {
    id: "p_4",
    author: {
      id: "u_8",
      name: "Kabir Malhotra",
      headline: "Cloud Architect at ScaleWorks",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces"
    },
    body:
      "Architecture note: boring infrastructure is underrated. The teams that move fastest often have the fewest surprising production paths.",
    likesCount: 64,
    commentsCount: 8,
    sharesCount: 3,
    hasLiked: false,
    canDelete: false,
    comments: [],
    createdAt: "2026-05-27T10:05:00.000Z"
  }
];

export const suggestions: ConnectionSuggestion[] = [
  {
    id: "u_4",
    name: "Kavya Nair",
    headline: "Data Scientist at FinAxis",
    avatarUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=160&h=160&fit=crop&crop=faces",
    followersCount: 1840,
    mutualConnections: 18,
    status: "none"
  },
  {
    id: "u_5",
    name: "Aditya Rao",
    headline: "Senior Backend Engineer",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop&crop=faces",
    followersCount: 920,
    mutualConnections: 9,
    status: "none"
  },
  {
    id: "u_6",
    name: "Nisha Verma",
    headline: "People Operations Lead",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces",
    followersCount: 2610,
    mutualConnections: 27,
    status: "none"
  }
];
