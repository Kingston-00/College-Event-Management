const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { httpError } = require('../middleware/errorHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/events - keyword search, filters, sort and pagination.
exports.getEvents = async (req, res, next) => {
  try {
    const { q, category, status, from, to, sort = 'date', page = 1, limit = 9 } = req.query;
    const filter = {};

    if (q) {
      const rx = new RegExp(escapeRegex(String(q)), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { organizer: rx }, { venue: rx }];
    }
    if (category) filter.category = String(category);
    if (status) filter.status = String(status);
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const sortMap = {
      date: { date: 1 },
      '-date': { date: -1 },
      title: { title: 1 },
      popularity: { registeredCount: -1 },
      newest: { createdAt: -1 },
    };
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 9, 1), 50);

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort(sortMap[sort] || sortMap.date)
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      Event.countDocuments(filter),
    ]);
    res.json({ events, total, page: pageNum, pages: Math.ceil(total / pageSize) });
  } catch (err) {
    next(err);
  }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw httpError(404, 'Event not found');
    res.json({ event });
  } catch (err) {
    next(err);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, registeredCount: 0, createdBy: req.user._id });
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw httpError(404, 'Event not found');
    // registeredCount and createdBy are system-managed.
    const { registeredCount, createdBy, ...changes } = req.body;
    if (changes.capacity && changes.capacity < event.registeredCount) {
      throw httpError(400, `Capacity cannot be below current registrations (${event.registeredCount})`);
    }
    Object.assign(event, changes);
    await event.save();
    res.json({ event });
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) throw httpError(404, 'Event not found');
    await Registration.deleteMany({ event: event._id });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};
