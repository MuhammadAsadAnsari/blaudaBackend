const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');

const {
  createPrivacyPolicy,
  updatePrivacyPolicy,
  getPrivacyPolicy
} = require('../controllers/privacyPolicyController');

const router = express.Router();

router
  .route('/')
  .get(getPrivacyPolicy)

router
  .route('/')
  .post(protect, restrictTo('admin'), createPrivacyPolicy);

router.use(protect, restrictTo('admin'));

router
  .route('/:id')
  .patch(updatePrivacyPolicy)

module.exports = router;
