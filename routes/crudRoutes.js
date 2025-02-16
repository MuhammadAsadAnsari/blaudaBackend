const express = require('express');

const {
  getPageData,
  addPageData,
  updatePageData,
  deletePageData,
} = require('../controllers/crudController');
const { protect, restrictTo } = require('../controllers/authController');
const { uploadUserImage } = require('../utils/s3');

const router = express.Router();

// Protect all routes after this middleware
// router.use(authController.protect);

router.route('/').get(getPageData);

router.use(protect);
// router.use(restrictTo('admin'));

router.route('/').post(uploadUserImage, addPageData);

router
  .route('/:id')
  .patch(uploadUserImage, updatePageData)
  .delete(deletePageData);

module.exports = router;
