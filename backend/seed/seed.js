require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const posters = require('./posters');

const DAY = 24 * 60 * 60 * 1000;
// Build a date `n` days from today at midnight UTC (negative = past).
const daysFromNow = (n) => {
  const d = new Date(Date.now() + n * DAY);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const students = [
  { name: 'Aarav Sharma', email: 'aarav@college.edu', department: 'Computer Science', year: 3, rollNumber: 'CS21001', phone: '9876500001' },
  { name: 'Diya Patel', email: 'diya@college.edu', department: 'Electronics', year: 2, rollNumber: 'EC22014', phone: '9876500002' },
  { name: 'Rohan Mehta', email: 'rohan@college.edu', department: 'Mechanical', year: 4, rollNumber: 'ME20033', phone: '9876500003' },
  { name: 'Sneha Iyer', email: 'sneha@college.edu', department: 'Information Technology', year: 1, rollNumber: 'IT23007', phone: '9876500004' },
  { name: 'Karan Singh', email: 'karan@college.edu', department: 'Civil', year: 3, rollNumber: 'CE21022', phone: '9876500005' },
];

// [title, category, dayOffset, start, end, venue, organizer, capacity, status, description]
const eventData = [
  ['Hackathon 2026: Code for Campus', 'Technical', 12, '09:00', '21:00', 'Innovation Lab, Block A', 'Coding Club', 120, 'upcoming', 'A 12-hour team hackathon to build tools that improve campus life. Mentors, snacks and prizes worth Rs. 50,000.'],
  ['Annual Cultural Fest: Rangotsav', 'Cultural', 25, '16:00', '22:00', 'Main Auditorium', 'Cultural Committee', 500, 'upcoming', 'An evening of dance, music, drama and art showcasing talent from every department.'],
  ['Inter-Department Cricket Tournament', 'Sports', 8, '08:00', '17:00', 'College Ground', 'Sports Council', 150, 'upcoming', 'Knockout T10 cricket tournament. Teams of 11 plus 3 substitutes.'],
  ['Full-Stack Web Development Workshop', 'Workshop', 5, '10:00', '16:00', 'Computer Lab 3', 'IT Department', 60, 'upcoming', 'Hands-on workshop covering React, Node.js and MongoDB. Bring your laptop.'],
  ['AI in Healthcare: Expert Seminar', 'Seminar', 16, '11:00', '13:00', 'Seminar Hall 1', 'Department of Computer Science', 200, 'upcoming', 'Industry speaker discusses applications of machine learning in diagnostics and patient care.'],
  ['Robotics Challenge', 'Technical', 30, '09:30', '17:30', 'Mechanical Workshop', 'Robotics Society', 80, 'upcoming', 'Design and race line-following robots. Open to all branches.'],
  ['Battle of Bands', 'Cultural', 20, '18:00', '21:30', 'Open Air Theatre', 'Music Club', 300, 'upcoming', 'Live band competition with judges from the local music scene.'],
  ['Photography Walk & Workshop', 'Workshop', 3, '06:30', '10:30', 'Botanical Garden', 'Photography Club', 40, 'upcoming', 'Learn composition and lighting basics, then shoot together around campus.'],
  ['Startup Pitch Day', 'Other', 40, '10:00', '15:00', 'Incubation Centre', 'E-Cell', 100, 'upcoming', 'Student founders pitch to a panel of angel investors and alumni.'],
  ['Inter-College Football Cup', 'Sports', -20, '15:00', '19:00', 'College Ground', 'Sports Council', 200, 'completed', 'Four-team football cup concluded with a thrilling final.'],
  ['Cybersecurity Awareness Seminar', 'Seminar', -10, '14:00', '16:00', 'Seminar Hall 2', 'IEEE Student Branch', 150, 'completed', 'Phishing, password hygiene and safe browsing explained by security professionals.'],
  ['Open Mic Night', 'Cultural', 14, '17:30', '20:00', 'Student Cafe', 'Literary Society', 3, 'upcoming', 'Poetry, stand-up and acoustic sets. Very limited seats.'],
];

const seed = async () => {
  await Promise.all([User.deleteMany({}), Event.deleteMany({}), Registration.deleteMany({})]);

  // Users are created one by one so the password-hashing hook runs.
  const admin = await User.create({
    name: 'Admin User', email: 'admin@college.edu', password: 'Admin@123', role: 'admin', department: 'Administration',
  });
  const studentDocs = [];
  for (const s of students) studentDocs.push(await User.create({ ...s, password: 'Student@123', role: 'student' }));

  const events = await Event.insertMany(
    eventData.map(([title, category, off, startTime, endTime, venue, organizer, capacity, status, description]) => ({
      title, category, date: daysFromNow(off), startTime, endTime, venue, organizer, capacity, status, description,
      posterUrl: posters[title] || '',
      registrationDeadline: daysFromNow(off - 1),
      createdBy: admin._id,
    }))
  );

  // Registrations: every student joins a few events; the "Open Mic" event is filled up.
  const regs = [];
  const add = (event, user, status = 'registered') => regs.push({ event: event._id, user: user._id, status });
  studentDocs.forEach((s, i) => {
    add(events[0], s);
    add(events[3 + (i % 2)], s);
    if (i % 2 === 0) add(events[1], s);
    add(events[9], s, i < 4 ? 'attended' : 'cancelled'); // completed football cup
    if (i < 3) add(events[10], s, 'attended');
  });
  studentDocs.slice(0, 3).forEach((s) => add(events[11], s)); // fills Open Mic (capacity 3)

  await Registration.insertMany(regs);

  // Recompute registeredCount from the data so counts always match.
  for (const ev of events) {
    const count = regs.filter((r) => String(r.event) === String(ev._id) && r.status !== 'cancelled').length;
    await Event.updateOne({ _id: ev._id }, { registeredCount: count });
  }
  return { users: studentDocs.length + 1, events: events.length, registrations: regs.length };
};

module.exports = seed;

if (require.main === module) {
  (async () => {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not set. Create backend/.env from .env.example first.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    const result = await seed();
    console.log('Seed complete:', result);
    console.log('Admin:   admin@college.edu / Admin@123');
    console.log('Student: aarav@college.edu / Student@123 (all seeded students use Student@123)');
    await mongoose.disconnect();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
