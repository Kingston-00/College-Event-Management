const mongoose = require('mongoose');

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'];
const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    category: { type: String, enum: CATEGORIES, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true },
    venue: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    posterUrl: { type: String, trim: true, default: '' },
    capacity: { type: Number, required: true, min: 1 },
    registeredCount: { type: Number, default: 0, min: 0 },
    registrationDeadline: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: 'upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes for search, filtering and sorting.
eventSchema.index({ title: 'text', description: 'text', organizer: 'text' });
eventSchema.index({ title: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
