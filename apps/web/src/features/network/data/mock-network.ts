import type { NetworkOverview } from "@linkedin-clone/shared";

export const mockNetworkOverview: NetworkOverview = {
  followersCount: 1264,
  connectionsCount: 842,
  incomingRequests: [
    {
      id: "net-req-1",
      createdAt: "2026-06-01T10:15:00.000Z",
      from: {
        id: "net-1",
        name: "Priya Menon",
        headline: "Technical Recruiter at HireLoop",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces",
        location: "Mumbai, India",
        followersCount: 3200,
        mutualConnections: 18,
        status: "pending_received"
      }
    },
    {
      id: "net-req-2",
      createdAt: "2026-06-01T08:30:00.000Z",
      from: {
        id: "net-2",
        name: "Samar Jain",
        headline: "Frontend Engineer at CraftUI",
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces",
        location: "Delhi, India",
        followersCount: 890,
        mutualConnections: 7,
        status: "pending_received"
      }
    }
  ],
  suggestions: [
    {
      id: "net-3",
      name: "Aisha Khan",
      headline: "Product Manager | B2B Platforms",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",
      location: "Bengaluru, India",
      followersCount: 5400,
      mutualConnections: 24,
      status: "none"
    },
    {
      id: "net-4",
      name: "Rahul Verma",
      headline: "Backend Developer at CloudBridge",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop&crop=faces",
      location: "Pune, India",
      followersCount: 2100,
      mutualConnections: 13,
      status: "none"
    },
    {
      id: "net-5",
      name: "Neha Kapoor",
      headline: "UI Designer and Design Systems Lead",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces",
      location: "Hyderabad, India",
      followersCount: 1750,
      mutualConnections: 9,
      status: "none"
    }
  ],
  connections: [
    {
      id: "net-6",
      name: "Karan Shah",
      headline: "Full Stack Developer",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",
      location: "Ahmedabad, India",
      followersCount: 980,
      mutualConnections: 31,
      status: "connected"
    },
    {
      id: "net-7",
      name: "Isha Rao",
      headline: "Data Analyst at InsightWorks",
      avatarUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=160&h=160&fit=crop&crop=faces",
      location: "Chennai, India",
      followersCount: 1430,
      mutualConnections: 16,
      status: "connected"
    }
  ]
};
