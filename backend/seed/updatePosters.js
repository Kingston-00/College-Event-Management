/**
 * Updates posterUrl on the seeded events (matched by title) without touching
 * any other data. Run with: npm run seed:posters
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Event = require('../models/Event');
const posters = require('./posters');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const [title, posterUrl] of Object.entries(posters)) {
    const res = await Event.updateOne({ title }, { posterUrl });
    console.log(`${res.matchedCount ? 'updated' : 'not found'}: ${title}`);
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
