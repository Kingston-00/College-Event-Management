const router = require('express').Router();
const { param } = require('express-validator');
const { getStats, exportAttendees } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');

router.use(protect, authorize('admin'));
router.get('/stats', getStats);
router.get('/events/:id/export', param('id').isMongoId(), validate, exportAttendees);

module.exports = router;
