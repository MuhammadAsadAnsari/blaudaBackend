const express = require('express');

const {
  getAllNewsLettersForAdmin,
  createNewsLetter
} = require('../controllers/newsLetterController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.route('/').post(createNewsLetter);

router.use(protect);

router.use(restrictTo('admin'));

router.route('/').get(getAllNewsLettersForAdmin);

module.exports = router;
