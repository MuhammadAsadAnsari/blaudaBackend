const express = require('express');
const commentController = require('../controllers/commentController');
const { uploadUserImage } = require('../utils/s3');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .post(protect,restrictTo("user"),commentController.createComment);

//middleware to restrict admin routes
router.use(protect, restrictTo('admin'));

router.route('/admin/all').get(commentController.getAllCommentsForAdmin);
router.route('/:id').patch(commentController.updateCommentStatus);

module.exports = router;
