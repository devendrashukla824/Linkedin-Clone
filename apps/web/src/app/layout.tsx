import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ProNet | Professional Network",
    template: "%s | ProNet"
  },
  description: "A production-ready LinkedIn-inspired professional networking platform for profiles, feeds, jobs, messaging and admin workflows.",
  applicationName: "ProNet",
  authors: [{ name: "ProNet" }],
  keywords: ["professional network", "LinkedIn clone", "jobs", "messaging", "social feed", "networking"],
  creator: "ProNet",
  publisher: "ProNet",
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: "website",
    title: "ProNet | Professional Network",
    description: "Build your professional network with profiles, jobs, messaging and a focused social feed.",
    siteName: "ProNet",
    url: "/"
  },
  twitter: {
    card: "summary_large_image",
    title: "ProNet | Professional Network",
    description: "A LinkedIn-inspired professional networking platform."
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
