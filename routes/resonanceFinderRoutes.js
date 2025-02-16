const express = require('express');
const resonanceFinderController = require('../controllers/resonanceFinderController');
const { uploadUserImage } = require('../utils/s3');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// user can get all resonance finder
router
  .route('/')
  .post(
    protect,
    restrictTo('admin'),
    uploadUserImage,
    resonanceFinderController.createResonanceFinder
  );

router
  .route('/')
  .get(resonanceFinderController.getResonanceFinder)

router
  .route('/update')
  .patch(uploadUserImage, resonanceFinderController.updateResonanceFinder)

module.exports = router;
