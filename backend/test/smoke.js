/**
 * End-to-end API smoke test. Starts an in-memory MongoDB (no Atlas needed),
 * seeds it, boots the real Express server and exercises the main flows.
 * Run with: npm run test:smoke
 */
const assert = require('assert');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = 5055;
const BASE = `http://localhost:${PORT}/api`;

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};

const check = (name, cond) => {
  assert.ok(cond, `FAILED: ${name}`);
  console.log(`  ok  ${name}`);
};

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('cems_test');
  process.env.JWT_SECRET = 'test_secret';
  process.env.PORT = String(PORT);
  process.env.CLIENT_URL = 'http://localhost:5173';

  require('../server');
  await new Promise((r) => setTimeout(r, 1500));
  const mongoose = require('mongoose');
  const summary = await require('../seed/seed')();
  check(`seed created ${JSON.stringify(summary)}`, summary.events === 12);

  // --- Auth ---
  let r = await call('POST', '/auth/register', { body: { name: 'Test Student', email: 'test@college.edu', password: 'secret1' } });
  check('register -> 201 + token', r.status === 201 && r.data.token);
  const studentToken = r.data.token;
  r = await call('POST', '/auth/register', { body: { name: 'Dup', email: 'test@college.edu', password: 'secret1' } });
  check('duplicate email -> 409', r.status === 409);
  r = await call('POST', '/auth/register', { body: { name: 'Bad', email: 'nope', password: '1' } });
  check('invalid register -> 422', r.status === 422);
  r = await call('POST', '/auth/login', { body: { email: 'admin@college.edu', password: 'Admin@123' } });
  check('admin login -> 200', r.status === 200 && r.data.user.role === 'admin');
  const adminToken = r.data.token;
  r = await call('POST', '/auth/login', { body: { email: 'admin@college.edu', password: 'wrong' } });
  check('wrong password -> 401', r.status === 401);
  r = await call('GET', '/auth/me', { token: studentToken });
  check('me -> student', r.data.user.email === 'test@college.edu');

  // --- Events ---
  r = await call('GET', '/events?category=Sports&sort=date&limit=5');
  check('filter by category', r.status === 200 && r.data.events.every((e) => e.category === 'Sports') && r.data.total === 2);
  r = await call('GET', '/events?q=hackathon');
  check('keyword search', r.data.total === 1);
  r = await call('GET', '/events?page=2&limit=5');
  check('pagination', r.data.events.length === 5 && r.data.pages === 3);

  const newEvent = {
    title: 'Smoke Test Event', description: 'Created by smoke test', category: 'Workshop',
    date: new Date(Date.now() + 5 * 864e5).toISOString(), startTime: '10:00', endTime: '12:00',
    venue: 'Room 1', organizer: 'QA', capacity: 1, registrationDeadline: new Date(Date.now() + 4 * 864e5).toISOString(),
  };
  r = await call('POST', '/events', { token: studentToken, body: newEvent });
  check('student cannot create event -> 403', r.status === 403);
  r = await call('POST', '/events', { body: newEvent });
  check('anonymous cannot create event -> 401', r.status === 401);
  r = await call('POST', '/events', { token: adminToken, body: { ...newEvent, capacity: 0 } });
  check('invalid capacity -> 422', r.status === 422);
  r = await call('POST', '/events', { token: adminToken, body: newEvent });
  check('admin creates event -> 201', r.status === 201);
  const eventId = r.data.event._id;
  r = await call('PUT', `/events/${eventId}`, { token: adminToken, body: { venue: 'Room 2' } });
  check('admin updates event', r.status === 200 && r.data.event.venue === 'Room 2');

  // --- Registrations ---
  r = await call('POST', `/registrations/${eventId}`, { token: studentToken });
  check('student registers -> 201', r.status === 201 && r.data.event.registeredCount === 1);
  r = await call('POST', `/registrations/${eventId}`, { token: studentToken });
  check('duplicate registration -> 409', r.status === 409);
  const other = await call('POST', '/auth/register', { body: { name: 'Other', email: 'other@college.edu', password: 'secret1' } });
  r = await call('POST', `/registrations/${eventId}`, { token: other.data.token });
  check('full event -> 400', r.status === 400 && /full/i.test(r.data.message));
  r = await call('GET', '/registrations/my', { token: studentToken });
  check('my registrations', r.data.registrations.length === 1);
  r = await call('GET', `/registrations/event/${eventId}`, { token: adminToken });
  check('admin lists attendees', r.data.registrations.length === 1);
  const regId = r.data.registrations[0]._id;
  r = await call('PATCH', `/registrations/${regId}/attendance`, { token: adminToken, body: {} });
  check('mark attended', r.data.registration.status === 'attended');
  r = await call('GET', `/admin/events/${eventId}/export`, { token: adminToken });
  check('CSV export', r.status === 200 && r.data.includes('test@college.edu'));
  r = await call('DELETE', `/registrations/${eventId}`, { token: studentToken });
  check('cancel on attended -> 404', r.status === 404);

  // Cancel flow on a seeded event
  r = await call('GET', '/events?q=photography');
  const photoId = r.data.events[0]._id;
  await call('POST', `/registrations/${photoId}`, { token: studentToken });
  r = await call('DELETE', `/registrations/${photoId}`, { token: studentToken });
  check('cancel registration', r.status === 200 && r.data.event.registeredCount === 0);
  r = await call('POST', `/registrations/${photoId}`, { token: studentToken });
  check('re-register after cancel', r.status === 201);

  // Deadline / completed event
  r = await call('GET', '/events?status=completed');
  r = await call('POST', `/registrations/${r.data.events[0]._id}`, { token: studentToken });
  check('completed event closed -> 400', r.status === 400);

  // --- Admin ---
  r = await call('GET', '/admin/stats', { token: adminToken });
  check('admin stats', r.status === 200 && r.data.totalEvents === 13 && r.data.eventsByCategory.length > 0);
  r = await call('GET', '/admin/stats', { token: studentToken });
  check('student blocked from stats -> 403', r.status === 403);

  r = await call('DELETE', `/events/${eventId}`, { token: adminToken });
  check('admin deletes event', r.status === 200);
  r = await call('GET', `/events/${eventId}`);
  check('deleted event -> 404', r.status === 404);
  r = await call('GET', '/events/not-an-id');
  check('bad id -> 422', r.status === 422);

  console.log('\nAll smoke tests passed.');
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
