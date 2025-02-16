const express = require('express');
const packageController = require('../controllers/packageController');
const { uploadUserImage } = require('../utils/s3');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// user can get all categories
router
  .route('/')
  .get(packageController.getAllPackages)
  .post(
    protect,
    restrictTo('super-admin', 'admin'),
    packageController.createPackage
  );

router
  .route('/:id')
  .get(packageController.singlePackage)

router
  .route('/buy')
  .post(protect,packageController.buyPackage)

//middleware to restrict admin routes
router.use(protect, restrictTo('super-admin', 'admin'));

router.route('/admin').get(packageController.getAllPackagesForAdmin);

//admin can update and delete a package
router
  .route('/:id')
  .patch(uploadUserImage, packageController.updatePackage)
  .delete(packageController.deletePackage);

module.exports = router;
