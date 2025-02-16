const express = require('express');
const multer = require('multer');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const { uploadUserImage } = require('../utils/s3');
const { protect, restrictTo } = require('../controllers/authController');

const {
  attachedPaymentMethod,
  deattachPaymentMethod,
  getPaymentMethods,
} = require('../utils/stripe');

const router = express.Router();


// signup and login apis
router.post('/signup', authController.signup);
router.post('/login', authController.login);
 // admin create category
  /**
  * @swagger
  * /users/admin-login:
  *   post:
  *     tags: 
  *       - User
  *     summary: Admin Login
  *     description: admin loggin in.
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               email:
  *                 type: string
  *               password:
  *                 type: string
  *               role:
  *                 type: string
  *     responses:
  *       200:
  *         description: success
  */
router.post('/admin-login', authController.adminLogin);

// forgot password and reset apis
router.post('/forgotPassword', authController.forgotPassword);
router.get('/resetPassword/:token', authController.resetPassword);
router.post('/resetPasswordDone', authController.resetPasswordDone);
router.post('/verify-me', authController.verifyMe);
router.patch('/verify-me-mobile', authController.verifyMeMobile);
router.post('/verify-forgot-password-otp', authController.verifyForgotPasswordOtp);

router
  .route('/detail/:id')
  .get(userController.getUser)

  /**
  * @swagger
  * /users:
  *   get:
  *     tags: 
  *       - User
  *     summary: Get a list of users
  *     description: Retrieve a list of user items.
  *     responses:
  *       200:
  *         description: A list of users
  */

router
  .route('/')
  .get(
    userController.getAllUsers
  );

router
  .route('/subscription/payment-success')
  .post(
    userController.paymentSuccess
  );
  
router.post('/resend-otp', authController.resendOtp);

// Protect all routes after this middleware with token
router.use(protect);

router.post('/join/waiting/list',userController.joinWaitingList);

router.get('/waiting/list', userController.getWaitingListUsers);

router.get('/me', authController.me);
router.get('/statistics', authController.statistics);


   //logout api
router.post('/logout', authController.logout);

//update password api
router.patch('/updateMyPassword', authController.updatePassword);

//update me api
router.patch(
  '/updateMe',
  authController.restrictTo('user',"admin"),
  uploadUserImage,
  userController.updateMe
);

/*  --------------------- STRIPE ---------------------  */
router
  .route('/attach-payment-method')
  .post(
    authController.restrictTo('user'),
    attachedPaymentMethod
  );

router
  .route('/detach-payment-method')
  .post(
    authController.restrictTo('user'),
    deattachPaymentMethod
  );

router
  .route('/payment-method-list')
  .get(authController.restrictTo('user'), getPaymentMethods);


router.use(authController.restrictTo('admin'));

router
  .route('/admin/all')
  .get(
    userController.getAllUsersForAdmin
  );

router
  .route('/activate-deactivate/:id')
  .patch(userController.activeDeactiveUser);

router
  .route('/update-teacher/:id')
  .patch(uploadUserImage,userController.adminUpdateTeacher);

router
  .route('/update/waitinglist/user/:id')
  .patch(uploadUserImage,userController.adminUpdateWaitingListUser);

router
  .route('/update-vibe-guide/:id')
  .patch(uploadUserImage,userController.adminUpdateVibeGuide);

router
  .route('/create-teacher')
  .post(uploadUserImage,userController.adminCreateTeacher);

router
  .route('/create-vibe-guide')
  .post(uploadUserImage,userController.adminCreateVibeGuide);

router
  .route('/delete-teacher/:id')
  .delete(userController.adminDeleteTeacher);

router
  .route('/delete-vibe-guide/:id')
  .delete(userController.adminDeleteVibeGuide);

module.exports = router;