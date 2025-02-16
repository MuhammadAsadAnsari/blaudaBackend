const express = require('express');
const { protect,restrictTo } = require('./../controllers/authController');
const {
  seenNotifiation,
  getAllNotificationsForAll,
  createNotification,
  updateNotification,
  deleteNotification,
  getAllNotificationsForAdmin
} = require('../controllers/notificationController');

const router = express.Router();
// Protect all routes after this middleware
router.use(protect);

router.route('/').post(createNotification);
router.route('/all').get(getAllNotificationsForAll);

router.route('/seen').get(protect, seenNotifiation);
router.route('/:id').patch(updateNotification).delete(deleteNotification);

router.route('/all').get(protect,restrictTo('admin','super-admin'),getAllNotificationsForAdmin);


module.exports = router;
