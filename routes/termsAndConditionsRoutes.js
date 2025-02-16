const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');

const {
  createTermsAndConditions,
  updateTermsAndConditions,
  getTermsAndConditions,
  
} = require('../controllers/termsAndConditionsController');

const router = express.Router();

router
  .route('/')
  .get(getTermsAndConditions)

router
  .route('/')
  .post(protect, restrictTo('admin'), createTermsAndConditions);

router.use(protect, restrictTo('admin'));

router
  .route('/:id')
  .patch(updateTermsAndConditions)


module.exports = router;
