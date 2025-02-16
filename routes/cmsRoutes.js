const express = require('express');
const { updatePage, getDynamicPage } = require('../controllers/cmsController');
const { uploadUserImage } = require('../utils/s3');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.route('/pages/all').get(getDynamicPage);

router.patch(
  '/page/update',
  protect,
  restrictTo('super-admin', 'admin'),
  uploadUserImage,
  updatePage
);

module.exports = router;
