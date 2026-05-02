# FredoCloud Hub

Collaborative Team Hub is a Turborepo full-stack application for teams to manage workspaces, goals, milestones, announcements, action items, realtime activity, notifications, analytics, and avatar uploads.

## Tech Stack

- Monorepo: Turborepo
- Frontend: Next.js App Router, JavaScript, Tailwind CSS, Zustand
- Backend: Node.js, Express.js, Prisma ORM
- Database: PostgreSQL
- Auth: JWT access and refresh tokens in httpOnly cookies
- Realtime: Socket.io
- Charts and export: Recharts, PapaParse
- File storage: Cloudinary

## Apps

- `apps/web`: Next.js frontend
- `apps/api`: Express REST API and Socket.io server

## Features

- Email and password registration and login
- Strong password validation
- Protected dashboard routes with session rehydration
- Access and refresh token cookie auth
- Logout
- User profile modal with Cloudinary avatar upload
- Create, switch, and delete workspaces
- Workspace name, description, and dynamic accent color
- Admin-only member invitations by email
- Role-aware UI for Admin and Member users
- Workspace members list for goal owners and action item assignees
- Goals with status, owner, due date, milestones, and progress updates
- Announcements with pinned state, comments, emoji reactions, and mention notifications
- Action items linked to goals with assignee, priority, due date, status, list view, and Kanban view
- Socket.io realtime updates for goals, announcements, comments, reactions, action items, and online presence
- In-app notifications
- Analytics dashboard with stat cards, goal charts, workspace CSV export, audit log timeline, and audit CSV export

## Advanced Features

1. Advanced RBAC: Admin-only announcement publishing, pinning, deleting, workspace deletion, and member invitations.
2. Audit Log: Workspace mutations are recorded in an immutable audit log with dashboard timeline and CSV export.

## Environment Variables

### Backend

Set these in `apps/api/.env` locally and in the Railway backend service:

```sh
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

For Railway, set `CLIENT_URL` to the deployed frontend URL.

### Frontend

Set these in the Railway frontend service:

```sh
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-api.up.railway.app
```

Local development defaults to:

```sh
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Local Setup

```sh
npm install
```

Create `apps/api/.env` with the backend variables.

Push the Prisma schema to the database:

```sh
cd apps/api
npx prisma db push
npx prisma generate
```

Start both services from the root:

```sh
npm run dev
```

The frontend runs on `http://localhost:3000`.
The API runs on `http://localhost:5000`.

## Useful Commands

```sh
npm run dev
npm run build
npm run lint
```

Backend-only:

```sh
cd apps/api
npm run dev
```

Frontend-only:

```sh
cd apps/web
npm run dev
```

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/:workspaceId/members`
- `GET /api/workspaces/:workspaceId/audit-logs`
- `POST /api/workspaces/:workspaceId/attachments`
- `POST /api/workspaces/:workspaceId/invite`
- `DELETE /api/workspaces/:workspaceId`
- `GET /api/workspaces/:workspaceId/goals`
- `POST /api/workspaces/:workspaceId/goals`
- `POST /api/workspaces/:workspaceId/goals/:goalId/updates`
- `GET /api/workspaces/:workspaceId/announcements`
- `POST /api/workspaces/:workspaceId/announcements`
- `POST /api/workspaces/:workspaceId/announcements/:announcementId/comments`
- `POST /api/workspaces/:workspaceId/announcements/:announcementId/reactions`
- `GET /api/workspaces/:workspaceId/action-items`
- `POST /api/workspaces/:workspaceId/action-items`
- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`
- `POST /api/users/avatar`

## Deployment Notes

Deploy `apps/api` and `apps/web` as separate Railway services in the same Railway project.

Backend service:

- Root directory: `apps/api`
- Start command: `npm run start`
- Add PostgreSQL through Railway and set `DATABASE_URL`
- Set all backend environment variables

Frontend service:

- Root directory: `apps/web`
- Build command: `npm run build`
- Start command: `npm run start`
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`

Because the API and frontend are separate Railway domains, production cookies use `SameSite=None` and `Secure`.

## Known Limitations

- Announcements store rich text content as text input, ready for a richer editor integration.
- Email notifications are not included; in-app notifications are implemented.
- Cloudinary attachment upload backend exists, while the current UI focuses on avatar uploads.
