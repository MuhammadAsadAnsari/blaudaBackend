const express = require('express');

const {
  getAllTags,
  getAllTagsForAdmin,
  createTag,
  updateTag,
  deleteTag,
  getTagDetail
} = require('../controllers/tagController');
const {uploadUserImage}=require('../utils/s3')
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.route('/').get(getAllTags);

router.use(protect);

router.use(restrictTo('admin'));

router.route('/admin/all').get(getAllTagsForAdmin);

router.route('/').post(uploadUserImage,createTag);
router.route('/:id').patch(uploadUserImage,updateTag);
router.route('/:id').delete(deleteTag);
router.route('/:id').get(getTagDetail);

module.exports = router;
