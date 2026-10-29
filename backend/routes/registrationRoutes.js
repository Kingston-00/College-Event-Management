const router = require('express').Router();
const { param } = require('express-validator');
const c = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');

const mongoId = (name) => param(name).isMongoId().withMessage(`Invalid ${name}`);

router.use(protect);
router.get('/my', c.myRegistrations);
router.get('/event/:eventId', authorize('admin'), mongoId('eventId'), validate, c.eventRegistrations);
router.patch('/:id/attendance', authorize('admin'), mongoId('id'), validate, c.markAttendance);
router.post('/:eventId', authorize('student'), mongoId('eventId'), validate, c.register);
router.delete('/:eventId', authorize('student'), mongoId('eventId'), validate, c.cancel);

module.exports = router;
