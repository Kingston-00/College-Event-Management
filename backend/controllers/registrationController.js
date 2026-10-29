const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { httpError } = require('../middleware/errorHandler');

// POST /api/registrations/:eventId
exports.register = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) throw httpError(404, 'Event not found');
    if (event.status === 'cancelled' || event.status === 'completed') {
      throw httpError(400, `Registration is closed: event is ${event.status}`);
    }
    if (new Date() > event.registrationDeadline) throw httpError(400, 'Registration deadline has passed');

    const existing = await Registration.findOne({ event: event._id, user: req.user._id });
    if (existing && existing.status !== 'cancelled') {
      throw httpError(409, 'You are already registered for this event');
    }

    // Atomic seat claim: only increments while room remains, so concurrent requests can't overbook.
    const claimed = await Event.findOneAndUpdate(
      { _id: event._id, $expr: { $lt: ['$registeredCount', '$capacity'] } },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );
    if (!claimed) throw httpError(400, 'Event is full');

    let registration;
    try {
      if (existing) {
        existing.status = 'registered';
        existing.registeredAt = new Date();
        registration = await existing.save();
      } else {
        registration = await Registration.create({ event: event._id, user: req.user._id });
      }
    } catch (err) {
      // Give the seat back if the registration could not be stored.
      await Event.updateOne({ _id: event._id }, { $inc: { registeredCount: -1 } });
      throw err;
    }
    res.status(201).json({ registration, event: claimed });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/registrations/:eventId
exports.cancel = async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      event: req.params.eventId,
      user: req.user._id,
      status: 'registered',
    });
    if (!registration) throw httpError(404, 'Active registration not found');
    registration.status = 'cancelled';
    await registration.save();
    const event = await Event.findOneAndUpdate(
      { _id: req.params.eventId, registeredCount: { $gt: 0 } },
      { $inc: { registeredCount: -1 } },
      { new: true }
    );
    res.json({ message: 'Registration cancelled', event });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/my
exports.myRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate('event')
      .sort({ registeredAt: -1 });
    // Drop registrations whose event was deleted.
    res.json({ registrations: registrations.filter((r) => r.event) });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/event/:eventId (admin)
exports.eventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) throw httpError(404, 'Event not found');
    const registrations = await Registration.find({ event: event._id })
      .populate('user', 'name email department year rollNumber phone')
      .sort({ registeredAt: 1 });
    res.json({ event, registrations });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/registrations/:id/attendance (admin)
exports.markAttendance = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) throw httpError(404, 'Registration not found');
    if (registration.status === 'cancelled') throw httpError(400, 'Cannot mark a cancelled registration');
    registration.status = req.body.attended === false ? 'registered' : 'attended';
    await registration.save();
    res.json({ registration });
  } catch (err) {
    next(err);
  }
};
