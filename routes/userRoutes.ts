import express from 'express';
import multer from 'multer';
import { getMe, updateMe } from './../controllers/userController';
import {
  signup,
  forgotPassword,
  resetPassword,
  resetPasswordDone,
  verifyMe,
  verifyForgotPasswordOtp,
  resendOtp,
  me,logout,updatePassword,
  adminLogin
} from './../controllers/authController';
import { uploadUserImage } from '../utils/s3';
import { protect, restrictTo } from '../controllers/authController';

const router = express.Router();

// signup and login apis
router.post('/signup', signup);
router.post('/admin-login', adminLogin);

router.post('/forgotPassword', forgotPassword);
router.get('/resetPassword/:token', resetPassword);
router.post('/resetPasswordDone', resetPasswordDone);
router.post('/verify-me', verifyMe);
router.post(
  '/verify-forgot-password-otp',
verifyForgotPasswordOtp
);

router.post('/resend-otp', resendOtp);

// Protect all routes after this middleware with token
router.use(protect);

router.get('/me', me);

//logout api
router.post('/logout', logout);

//update password api
router.put('/updateMyPassword', updatePassword);

//update me api
router.put(
  '/updateMe',
  restrictTo('user', 'admin'),
  uploadUserImage,
  updateMe
);

router.use(restrictTo('admin'));

// router
//   .route('/delete-vibe-guide/:id')
//   .delete(userController.adminDeleteVibeGuide);

export default router;
