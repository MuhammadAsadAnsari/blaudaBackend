import  express  from 'express';
import { uploadUserImage } from '../utils/s3';
import { restrictTo } from '../controllers/authController';

const router = express.Router();
