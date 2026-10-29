const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['registered', 'cancelled', 'attended'], default: 'registered' },
  registeredAt: { type: Date, default: Date.now },
});

// One registration document per (event, user); re-registering reactivates it.
registrationSchema.index({ event: 1, user: 1 }, { unique: true });
registrationSchema.index({ user: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
