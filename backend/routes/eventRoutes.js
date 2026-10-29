const router = require('express').Router();
const { body, param } = require('express-validator');
const { getEvents, getEvent, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { CATEGORIES, STATUSES } = require('../models/Event');

const TIME_RX = /^([01]\d|2[0-3]):[0-5]\d$/;

// `required` toggles between create (all fields) and update (partial).
const eventRules = (required) => {
  const f = (name) => (required ? body(name) : body(name).optional());
  return [
    f('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
    f('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 3000 }),
    f('category').isIn(CATEGORIES).withMessage(`Category must be one of ${CATEGORIES.join(', ')}`),
    f('date').isISO8601().withMessage('Valid date is required'),
    f('startTime').matches(TIME_RX).withMessage('startTime must be HH:mm'),
    f('endTime').matches(TIME_RX).withMessage('endTime must be HH:mm'),
    f('venue').trim().notEmpty().withMessage('Venue is required'),
    f('organizer').trim().notEmpty().withMessage('Organizer is required'),
    body('posterUrl')
      .optional({ values: 'falsy' })
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Poster must be a valid http(s) URL'),
    f('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1').toInt(),
    f('registrationDeadline').isISO8601().withMessage('Valid registration deadline is required'),
    body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
  ];
};

const idRule = param('id').isMongoId().withMessage('Invalid event id');

router.get('/', getEvents);
router.get('/:id', idRule, validate, getEvent);
router.post('/', protect, authorize('admin'), eventRules(true), validate, createEvent);
router.put('/:id', protect, authorize('admin'), idRule, eventRules(false), validate, updateEvent);
router.delete('/:id', protect, authorize('admin'), idRule, validate, deleteEvent);

module.exports = router;
