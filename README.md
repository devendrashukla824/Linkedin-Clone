# LinkedIn Clone Platform

A modern LinkedIn-inspired professional networking platform built with Next.js 15, TypeScript, Tailwind CSS, shadcn-style UI components, React Query, Zustand, Node.js, Express, MongoDB, JWT authentication, and Cloudinary.

## Structure

```text
apps/
  web/      Next.js 15 frontend
  api/      Express API with clean architecture
packages/
  shared/   Shared TypeScript interfaces and API contracts
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment templates:

```bash
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
```

3. Run the apps:

```bash
npm run dev:web
npm run dev:api
```

The web app runs on `http://localhost:3000` and the API runs on `http://localhost:5000`.

## Deployment Checklist

### 1. Production Services

- Create a MongoDB Atlas cluster and copy the production connection string.
- Create a Cloudinary project for profile images, post images, cover images, and resumes.
- Deploy the API to a Node.js host such as Render, Railway, Fly.io, or a VPS.
- Deploy the web app to Vercel or another Next.js-compatible host.

### 2. API Environment Variables

Set these variables on the backend host:

```bash
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=mongodb+srv://...
JWT_SECRET=use-a-long-random-secret-at-least-24-characters
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Web Environment Variables

Set these variables on the frontend host:

```bash
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://your-api-domain.com
```

Use a comma-separated `CLIENT_URL` list if you need to allow a production domain plus preview domains.

### 4. Build Commands

Backend:

```bash
npm install
npm run build --workspace @linkedin-clone/api
npm run start --workspace @linkedin-clone/api
```

Frontend:

```bash
npm install
npm run build --workspace @linkedin-clone/web
npm run start --workspace @linkedin-clone/web
```

### 5. Final Verification

- Confirm `GET https://your-api-domain.com/health` returns `success: true`.
- Register and log in with a real user account.
- Upload profile and cover images.
- Create, like, comment, repost, and send a post.
- Open messages and confirm Socket.io events work in real time.
- Create a job, apply with a resume, and confirm the recruiter can view/download it.
- Check notifications for likes, comments, connection requests, reposts, shares, and applications.
- Confirm protected routes redirect logged-out users.
- Confirm admin pages only work for admin users.
- Run Lighthouse or Vercel Speed Insights for SEO, accessibility, and performance.
