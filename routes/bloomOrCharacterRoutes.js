const express = require('express');

const {
  getAllBloomsOrCharacters,
  getAllBloomsOrCharactersForAdmin,
  createBloomOrCharacter,
  updateBloomOrCharacter,
  deleteBloomOrCharacter
} = require('../controllers/bloomOrCharacterController');
const {uploadUserImage}=require('../utils/s3')
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.route('/').get(getAllBloomsOrCharacters);

router.use(protect);

router.use(restrictTo('admin'));

router.route('/admin/all').get(getAllBloomsOrCharactersForAdmin);

router.route('/').post(uploadUserImage,createBloomOrCharacter);
router.route('/:id').patch(uploadUserImage,updateBloomOrCharacter);
router.route('/:id').delete(deleteBloomOrCharacter);

module.exports = router;
