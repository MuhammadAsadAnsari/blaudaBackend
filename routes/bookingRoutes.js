const express = require('express');
const {
    getBookings,
    bookVibeGuide,
    getBookingDetail,
    getMyClasses,
    updateBooking,
    getVibeGuideBookings
} = require('../controllers/bookingController');
const { protect,restrictTo} = require('../controllers/authController');

const router = express.Router();

router.use(protect);

//get booking detail
router.route('/:id')
.get(getBookingDetail)
.patch(restrictTo('admin'),updateBooking);

//get all bookings
router.route('/').get(getBookings);

//get all vibe guide bookings
router.route('/vibe-guide/:id').get(getVibeGuideBookings);

router.route('/my-classes').get(getMyClasses);

// book trainer api
router.route('/').post(bookVibeGuide);

module.exports = router;
