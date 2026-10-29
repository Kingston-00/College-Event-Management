const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');
const { httpError } = require('../middleware/errorHandler');

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const [totalEvents, totalStudents, totalRegistrations, byCategory, upcomingEvents, topEvents] =
      await Promise.all([
        Event.countDocuments(),
        User.countDocuments({ role: 'student' }),
        Registration.countDocuments({ status: { $ne: 'cancelled' } }),
        Event.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Event.find({ date: { $gte: now }, status: 'upcoming' }).sort({ date: 1 }).limit(5),
        Event.find().sort({ registeredCount: -1 }).limit(5).select('title registeredCount capacity'),
      ]);
    res.json({
      totalEvents,
      totalStudents,
      totalRegistrations,
      eventsByCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
      upcomingEvents,
      topEvents,
    });
  } catch (err) {
    next(err);
  }
};

// Quote a CSV cell and neutralise spreadsheet formula injection (=, +, -, @).
const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

// GET /api/admin/events/:id/export
exports.exportAttendees = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw httpError(404, 'Event not found');
    const regs = await Registration.find({ event: event._id }).populate(
      'user',
      'name email department year rollNumber phone'
    );
    const header = ['Name', 'Email', 'Roll Number', 'Department', 'Year', 'Phone', 'Status', 'Registered At'];
    const rows = regs
      .filter((r) => r.user)
      .map((r) => [
        r.user.name, r.user.email, r.user.rollNumber, r.user.department,
        r.user.year, r.user.phone, r.status, r.registeredAt.toISOString(),
      ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const filename = event.title.replace(/[^a-z0-9]+/gi, '_') + '_attendees.csv';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
