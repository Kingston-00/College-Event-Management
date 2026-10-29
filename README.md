# 🎓 CampusEvents - College Event Management System

A full-stack web application where college admins create and manage events (fests, workshops, seminars, sports, cultural events) and students browse, register and track them. Built as a Web Technology course project to demonstrate **HTML, CSS, JavaScript, Node.js, MongoDB Atlas and React.js**.

## Features

**Students**
- Browse events with live (debounced) search, category / status / date-range filters, sorting and pagination
- Event page with capacity progress bar, live countdown timer and Register / Cancel
- Dashboard with upcoming registrations, history and cancel option; full "My registrations" table
- Dark / light theme, responsive layout (mobile, tablet, desktop)

**Admins**
- Dashboard: stat cards and pure-CSS bar charts (events by category, seat fill rate)
- Create / edit / delete events, view attendees, mark attendance, download attendees as CSV

**Platform**
- JWT authentication with bcrypt-hashed passwords, role-based access (`admin`, `student`), auto-logout when the token expires
- Server-side validation, centralized error handling, Helmet, CORS whitelist, rate limiting on auth routes
- Atomic seat reservation (no overbooking), duplicate / deadline / capacity checks
- A standalone `about.html` (pure HTML + CSS + vanilla JS: event calendar and FAQ accordion)

## Tech stack

| Layer | Technology |
|-------|-----------|
| Markup / styling | Semantic HTML5, hand-written CSS (variables, Flexbox, Grid, animations, media queries) |
| Frontend | React 18 (Vite), React Router 6, Axios, vanilla JS utilities |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas via Mongoose |
| Auth & security | JWT, bcryptjs, helmet, cors, express-validator, express-rate-limit |
| Tooling | nodemon, morgan, dotenv, concurrently |

## Architecture

```
┌──────────────────────────┐      HTTPS / JSON       ┌──────────────────────────────┐
│  React SPA (Vite :5173)  │ ──────────────────────▶ │  Express API (:5000)         │
│  pages · components      │   Authorization: JWT    │  routes → middleware →       │
│  AuthContext · Axios     │ ◀────────────────────── │  controllers → Mongoose      │
└──────────────────────────┘                         └──────────────┬───────────────┘
   public/about.html (static)                                       │ MONGO_URI
                                                                    ▼
                                                       ┌──────────────────────────┐
                                                       │  MongoDB Atlas           │
                                                       │  users · events ·        │
                                                       │  registrations           │
                                                       └──────────────────────────┘
```

## Project structure

```
college-event-management/
├── backend/    config · models · controllers · routes · middleware · seed · test
├── frontend/   public/about.html · src/{api,context,components,pages,styles,utils}
├── docs/       API.md · DB_SCHEMA.md · SCREENSHOTS.md
└── package.json   (root scripts: dev, seed, install:all, build)
```

## Setup

### 1. Prerequisites
Node.js 18+ and npm. A free MongoDB Atlas account.

### 2. Create a free MongoDB Atlas cluster
1. Sign up at <https://www.mongodb.com/cloud/atlas/register> and create a **Project**.
2. Click **Create** (Build a Database) → choose the free **M0** tier → pick a provider/region → **Create**.
3. **Database Access** → *Add New Database User* → username + password (auto-generate and copy it) → role *Read and write to any database*.
4. **Network Access** → *Add IP Address* → *Add current IP address* (or `0.0.0.0/0` for development only).
5. **Database** → *Connect* → *Drivers* → copy the connection string, e.g.
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Insert the database name before the `?`: `...mongodb.net/college_events?retryWrites=...`. URL-encode special characters in the password (`@` → `%40`).

### 3. Install dependencies
```bash
npm run install:all          # root + backend + frontend
```

### 4. Configure environment
```bash
cp backend/.env.example backend/.env      # then edit backend/.env
cp frontend/.env.example frontend/.env    # optional, defaults to http://localhost:5000/api
```
| Variable | Where | Description |
|----------|-------|-------------|
| `PORT` | backend | API port (default 5000) |
| `MONGO_URI` | backend | Atlas connection string |
| `JWT_SECRET` | backend | Long random string, e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRE` | backend | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | backend | Allowed CORS origin(s), comma separated |
| `VITE_API_URL` | frontend | API base URL |

### 5. Seed the database
```bash
npm run seed
```
Creates 1 admin, 5 students, 12 events across all categories and sample registrations. **It wipes existing users, events and registrations.**

### 6. Run
```bash
npm run dev                  # backend (nodemon) + frontend (Vite) together
# or separately:
npm run dev --prefix backend
npm run dev --prefix frontend
```
Open <http://localhost:5173>. The static page is at <http://localhost:5173/about.html>.

### Try it without Atlas
```bash
npm run dev:memory --prefix backend   # API on :5000 with a seeded in-memory MongoDB
npm run dev --prefix frontend
```
Data disappears when you stop it. Run the automated API smoke test with `npm run test:smoke --prefix backend`.

## Default credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@college.edu` | `Admin@123` |
| Student | `aarav@college.edu` (also `diya@`, `rohan@`, `sneha@`, `karan@`) | `Student@123` |

Change these before any real deployment.

## API endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Logged in |
| GET | `/api/events` | Public (search, filter, sort, paginate) |
| GET | `/api/events/:id` | Public |
| POST / PUT / DELETE | `/api/events[/:id]` | Admin |
| POST | `/api/registrations/:eventId` | Student |
| DELETE | `/api/registrations/:eventId` | Student |
| GET | `/api/registrations/my` | Logged in |
| GET | `/api/registrations/event/:eventId` | Admin |
| PATCH | `/api/registrations/:id/attendance` | Admin |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/events/:id/export` | Admin (CSV) |

Full request/response examples: [docs/API.md](docs/API.md). Schema: [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md).

## Security notes
- Passwords hashed with bcrypt; never returned by the API.
- The JWT is kept in `localStorage` (simple, SPA-friendly). This is exposed to XSS, so React's output escaping is relied on and no HTML is injected. A production hardening step would be httpOnly cookies + CSRF protection.
- Sign-up always creates students; admins are only created by the seed script.
- Secrets live in `.env` files, which are git-ignored.

## Future enhancements
- Email / push reminders and QR-code check-in
- Waitlist when events are full
- Image upload for posters (Cloudinary / S3)
- Admin user management and event co-organizers
- httpOnly-cookie sessions and refresh tokens
- Automated unit and E2E tests, CI pipeline, Docker deployment
