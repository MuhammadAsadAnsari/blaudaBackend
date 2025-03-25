import  express  from 'express';
import { uploadUserImage } from '../utils/s3';
import { restrictTo } from '../controllers/authController';
import {
  getListingDetailsForUser,
  getAllListingsForHomePage,
  getListingsCount,
  getAllListingsForUser,
  getAllRecommendedListingsForUser,
} from '../controllers/listingController';

const router = express.Router();
router.get('/home', getAllListingsForHomePage);
router.get('/details/:slug', getListingDetailsForUser);
router.post('/all', getAllListingsForUser);
router.post('/recommended/all/:slug', getAllRecommendedListingsForUser);


router.get('/count', getListingsCount);

export default router;