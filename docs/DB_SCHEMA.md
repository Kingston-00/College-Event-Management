# Database Schema (MongoDB Atlas + Mongoose)

Database name: `college_events` (set in the connection string).

## users

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `name` | String | required, max 80 |
| `email` | String | required, **unique**, lowercase |
| `password` | String | bcrypt hash, `select: false` (never returned) |
| `role` | `admin` \| `student` | default `student` |
| `department` | String | |
| `year` | Number | 1-6 |
| `rollNumber` | String | |
| `phone` | String | |
| `createdAt` | Date | default now |

## events

| Field | Type | Notes |
|-------|------|-------|
| `title` | String | required, max 120 |
| `description` | String | required, max 3000 |
| `category` | enum | `Technical`, `Cultural`, `Sports`, `Workshop`, `Seminar`, `Other` |
| `date` | Date | stored as UTC midnight of the event day |
| `startTime`, `endTime` | String | `HH:mm` (24h) |
| `venue`, `organizer` | String | required |
| `posterUrl` | String | optional http(s) URL |
| `capacity` | Number | min 1 |
| `registeredCount` | Number | maintained atomically by the API |
| `registrationDeadline` | Date | |
| `status` | enum | `upcoming`, `ongoing`, `completed`, `cancelled` |
| `createdBy` | ObjectId → users | |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

**Indexes:** text index on `title`, `description`, `organizer`; single-field indexes on `title`, `category`, `date`.

## registrations

| Field | Type | Notes |
|-------|------|-------|
| `event` | ObjectId → events | required |
| `user` | ObjectId → users | required |
| `status` | enum | `registered`, `cancelled`, `attended` |
| `registeredAt` | Date | default now |

**Indexes:** unique compound `(event, user)` - one document per student per event. Cancelling sets `status: cancelled`; registering again reactivates the same document. Index on `user` for "my registrations".

## Relationships

```
users 1 ──< registrations >── 1 events
users 1 ──< events          (events.createdBy)
```

## Consistency notes

- `events.registeredCount` is changed with an atomic `findOneAndUpdate` guarded by `registeredCount < capacity`, so concurrent requests cannot overbook an event.
- Deleting an event deletes its registrations.
