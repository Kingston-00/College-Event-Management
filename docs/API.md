# API Reference

Base URL: `http://localhost:5000/api`. Send `Authorization: Bearer <token>` for protected routes. Errors are JSON: `{ "message": "...", "errors": { field: msg } }` (the `errors` map appears on validation failures, status 422).

| Status | Meaning |
|--------|---------|
| 200 / 201 | Success / created |
| 400 | Business rule failed (event full, deadline passed, ...) |
| 401 | Missing / invalid / expired token |
| 403 | Role not allowed |
| 404 | Not found |
| 409 | Duplicate (email, registration) |
| 422 | Validation error |
| 429 | Rate limit on `/auth/*` (50 requests / 15 min / IP) |

## Auth

### POST /auth/register
```bash
curl -X POST localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@college.edu","password":"secret1","department":"CSE","year":2}'
```
```json
{ "token": "eyJ...", "user": { "_id": "...", "name": "Test Student", "email": "test@college.edu", "role": "student" } }
```
Public sign-up always creates a `student`.

### POST /auth/login
```bash
curl -X POST localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@college.edu","password":"Admin@123"}'
```

### GET /auth/me
Returns the current user.

## Events

### GET /events
Query params: `q` (keyword), `category`, `status`, `from`, `to` (ISO dates), `sort` (`date`, `-date`, `title`, `popularity`, `newest`), `page`, `limit` (max 50).
```bash
curl "localhost:5000/api/events?q=hack&category=Technical&sort=date&page=1&limit=9"
```
```json
{ "events": [ { "_id": "...", "title": "Hackathon 2026", "capacity": 120, "registeredCount": 5 } ], "total": 1, "page": 1, "pages": 1 }
```

### GET /events/:id

### POST /events (admin)
```bash
curl -X POST localhost:5000/api/events -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" -d '{
  "title":"Chess Open","description":"Rapid chess","category":"Sports",
  "date":"2026-12-01T00:00:00.000Z","startTime":"10:00","endTime":"14:00",
  "venue":"Hall B","organizer":"Chess Club","capacity":32,
  "registrationDeadline":"2026-11-28T18:00:00.000Z"}'
```

### PUT /events/:id (admin) - partial update allowed
### DELETE /events/:id (admin) - also deletes its registrations

## Registrations

| Method & path | Role | Description |
|---------------|------|-------------|
| `POST /registrations/:eventId` | student | Register. Checks status, deadline, duplicates and capacity |
| `DELETE /registrations/:eventId` | student | Cancel own active registration |
| `GET /registrations/my` | any user | Own registrations with populated event |
| `GET /registrations/event/:eventId` | admin | Attendee list |
| `PATCH /registrations/:id/attendance` | admin | Body `{ "attended": true }` (false reverts) |

```bash
curl -X POST localhost:5000/api/registrations/$EVENT_ID -H "Authorization: Bearer $STUDENT"
```
```json
{ "registration": { "status": "registered" }, "event": { "registeredCount": 6, "capacity": 120 } }
```

## Admin (admin only)

### GET /admin/stats
```json
{ "totalEvents": 12, "totalStudents": 5, "totalRegistrations": 25,
  "eventsByCategory": [ { "category": "Technical", "count": 2 } ],
  "upcomingEvents": [ ], "topEvents": [ ] }
```

### GET /admin/events/:id/export
Returns `text/csv` (attachment) with name, email, roll number, department, year, phone, status and registration time. Cells starting with `= + - @` are prefixed with `'` to prevent spreadsheet formula injection.

## Health
`GET /health` -> `{ "status": "ok" }`
