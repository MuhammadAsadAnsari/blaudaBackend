const express = require('express');

const {
  getAllVideos,
  getAllVideosForAdmin,
  createVideo,
  updateVideo,
  getSingleVideoData,
  deleteVideo,
  featuredTools,
  featuredGroundwork,
  recommendVideo,
  getAllRecommendedVideos,
  getAllFeaturedVideos,
  getAllVideosByType,
  uploadAudio,
  addToRecentContent,
  addToFavourite,
  addToToolsToTry,
  addToTopTools,
  getVideosByTagId,
  getVideosByCategoryId
} = require('../controllers/videoController');
const {uploadUserImage}=require('../utils/s3')

const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.route('/').get(getAllVideos);

router.route('/by-type').get(getAllVideosByType);

router.route('/recommended').get(getAllRecommendedVideos);

router.route('/featured').get(getAllFeaturedVideos);

router.route('/:id').get(getSingleVideoData);

router.route('/tag/:id').get(getVideosByTagId);

router.route('/category/:id').get(getVideosByCategoryId);

router.use(protect);

router.route('/add-to-recent/:id').patch(addToRecentContent);

router.route('/add-to-favaourite/:id').patch(addToFavourite);

router.route('/add-to-tools-to-try/:id').patch(addToToolsToTry);

router.route('/add-to-top-tools/:id').patch(addToTopTools);

router.use(restrictTo('admin'));

router.route('/').post(uploadUserImage,createVideo);

router.route('/admin/all').get(getAllVideosForAdmin);

router.route('/:id').patch(uploadUserImage,updateVideo);

router.route('/featured/tools').patch(featuredTools);

router.route('/featured/groundwork').patch(featuredGroundwork);

router.route('/recommended/video').patch(recommendVideo);

router.route('/:id').delete(deleteVideo);

router.route('/audio/upload').post(uploadUserImage,uploadAudio);


module.exports = router;
