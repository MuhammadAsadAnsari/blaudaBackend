import express from 'express';

import { uploadUserImage } from '../utils/s3';
import { addListing ,getAllListings,getListingDetails, toggleActiveListing, updateListing} from '../controllers/listingController';
import { protect, restrictTo } from '../controllers/authController';
import { getAllContactUs } from '../controllers/contactusController';

const router = express.Router();
router.use(protect);
router.post('/listing/add', restrictTo('admin'), uploadUserImage, addListing);
router.get('/listing/getAll', restrictTo('admin'), getAllListings);
router.get('/contact/all', restrictTo('admin'), getAllContactUs);

router.get('/listing/details/:slug', restrictTo('admin'), getListingDetails);
router.put('/listing/toggle-active/:slug', restrictTo('admin'), toggleActiveListing);
router.put(
  '/listing/update/:slug',
  restrictTo('admin'),
  uploadUserImage,
  updateListing
);

export default router;