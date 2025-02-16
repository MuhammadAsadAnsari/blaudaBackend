const express = require('express');
const contactusController = require('../controllers/contactusController');
const { uploadUserImage } = require('../utils/s3');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .post(contactusController.createContactus);

//middleware to restrict admin routes
router.use(protect, restrictTo('super-admin', 'admin'));

router.route('/admin/all').get(contactusController.getAllContactusForAdmin);

module.exports = router;
