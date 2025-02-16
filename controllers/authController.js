const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const { customer } = require('../utils/stripe');
const Package = require('../models/packageModel');
const Video = require('../models/videoModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment=require("moment")

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const expireToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn:5
  });
};

const addFcmTokenOnLogin = async (email, token) => {
  if (email && token) {
    await User.findOneAndUpdate(
      { email },
      {
        $addToSet: {
          fcmToken: token,
        },
      }
    );
  }
};

exports.gotEnoughCoins = catchAsync(async (req, res, next) => {
  const { user } = req;

  if (!user?.wallet) return next(new AppError(`Wallet doesn't exist`, 400));

  if (user?.wallet?.coinsPurchased < Number(process.env.ASSIGNMENT_COINS_LIMIT))
    return next(new AppError('Insufficient Credits.', 401));

  next();
});

const createSendToken = (user, statusCode, req, res, resetPasswordDone) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    ...(resetPasswordDone && { isLoggedIn: true }),
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  let {
    role,
    firstName,
    lastName,
    email,
    password,
    passwordConfirm,
    country,
    state,
    postalCode,
    package,
    userType
  } = req.body;

  const otpCode = Math.floor(1000 + Math.random() * 9000)
  let newUser;

  if (['admin', 'super-admin'].includes(role))
    return next(new AppError('This is not a Admin Route', 403));

  const userExists = await User.findOne({ email: req.body.email });
  if (userExists) return next(new AppError('User already Exist.', 401));

  const newCustomer = await customer(req.body.email);

  const obj = {
    firstName,
    lastName,
    cus: newCustomer.id,
    email,
    password,
    passwordConfirm,
    country,
    state,
    postalCode,
    verificationCode: otpCode,
    package,
    userType
  };

  newUser = await User.create(obj);
  const populatedUser=await User.findById(newUser?._id).populate('package')

  const payload = {
    msg: `Your Confirmation Code is ${otpCode}`,
  };

  await new Email(populatedUser).sendUserRegisterEmail(payload);

  createSendToken(populatedUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  let user = await User.findOne({ email }).select(
    '+password +isVerified +wallet +isActive'
  ).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:'avatar'}, {path:'bloom'},{path:'package'},{path:"recentContent",populate:{path:"tags"}},{path:"favourites",populate:{path:"tags"}},{path:"toolsToTry",populate:{path:"tags"}},{path:"topTools",populate:{path:"tags"}}]);

  if (!user)
    return next(new AppError('No user is specified with this email.', 401));

  if (['admin', 'super-admin'].includes(user.role))
    return next(new AppError('Not a admin Login.', 403));

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (!user?.isVerified) {
    return next(new AppError('Please verify your account first!', 400));
  }

  if (!user?.isActive) {
    return next(new AppError('Your account is De activated by admin!', 400));
  }

  if(user?.userType=="web")
  if (!user?.isPaymentDone) {
    return next(new AppError('Please pay first then login!', 400));
  }

  // 3) If everything ok, send token to client

  // adding fcmTocken
  const { fcmToken } = req.body;

  await addFcmTokenOnLogin(email, fcmToken);

  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  if(!user?.isPaymentDone && user?.userType=="web"){

    const packageDetails=await Package.findById(user?.package);

    const session = await stripe.checkout.sessions.create({
      success_url: 'https://vibe-garden-web-xi.vercel.app/payment-success',
      cancel_url: 'https://vibe-garden-web-xi.vercel.app/payment-failure',
      line_items: [
        {price:packageDetails?.priceId, quantity: 1},
      ],
      mode: 'subscription',
    });

    res.status(200).json({
      status: 'success',
      token,
      data: { user, isLoggedIn: true,url:session?.url },
    });

    
  }
  else{
  res.status(200).json({
    status: 'success',
    token,
    data: { user, isLoggedIn: true },
  });
}
});

// Admin login
exports.adminLogin = catchAsync(async (req, res, next) => {
  const { email, password, role } = req.body;

  if (role !== 'admin' || role === undefined)
    return next(new AppError('you are not admin.', 401));

  const isUseralreadyExist = await User.findOne({ email });
  if (!isUseralreadyExist)
    return next(new AppError('No user is specified with this email.', 401));

  // 2) Check if user exists && password is correct
  let user = await User.findOne({ email }).select({
    password: 1,
    adminName: 1,
    role: 1,
    photo: 1,
    isVerified: 1,
    firstName: 1,
    lastName: 1,
    email:1,
    isOnline:1
  });

  if (user.role === 'user') return next(new AppError('Not a user route.', 401));

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  user=await User.findByIdAndUpdate(user?._id,{isOnline:true},{new:true}).select({
    password: 1,
    adminName: 1,
    role: 1,
    photo: 1,
    isVerified: 1,
    firstName: 1,
    lastName: 1,
    email:1,
    isOnline:1
  });
  // Remove password from output
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

exports.logout = catchAsync(async (req, res) => {
  const {token } = req.body;
  console.log("user",req.user?._id,"token",token)

  await User.findByIdAndUpdate(req.user._id, {
    // lastLogin: Date.now(),
    // $pull: { fcmToken: token },
    isOnline:false
    // $push: { loginHistory: logoutObject },
  });

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  
  const expiredToken=expireToken(req.user?._id)

  res.status(200).json({ status: 'success',data:expiredToken });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  console.log(token)

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded)
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id)

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  // res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log('req.user.role', req.user.role, { roles });
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 3) Send it to user's email
  try {
    const code = Math.floor(100000 + Math.random() * 900000);
    const resetCode = 'Your password resetcode is ' + code;

    user = await User.findOneAndUpdate(
      { email: req.body.email },
      { passwordResetCode: code },
      { new: true, runValidators: false }
    );


    await new Email(user, resetCode).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Code sent to email!',
    });
  } catch (err) {
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.verifyMe = catchAsync(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  let updatedUser = await User.findOneAndUpdate({ email, verificationCode }, { isVerified: true }, { new: true });

  if (!updatedUser) return next(new AppError('Invalid Verification Code'), 500);

  const packageDetails=await Package.findById(updatedUser?.package);

  const session = await stripe.checkout.sessions.create({
    success_url: 'https://vibe-garden-web-xi.vercel.app/payment-success',
    cancel_url: 'https://vibe-garden-web-xi.vercel.app/payment-failure',
    line_items: [
      {price:packageDetails?.priceId, quantity: 1},
    ],
    mode: 'subscription',
  });

  res.status(200).json({
    status: 'success',
    data:{user:updatedUser,url:session?.url}
  });
});

exports.verifyMeMobile = catchAsync(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  let updatedUser = await User.findOneAndUpdate({ email, verificationCode }, { isVerified: true }, { new: true });

  if (!updatedUser) return next(new AppError('Invalid Verification Code'), 500);

  res.status(200).json({
    status: 'success',
    data:updatedUser
  });
});

exports.me = catchAsync(async (req, res, next) => {

  const {user}=req;
  let foundUser = await User.findById(user?._id).populate([{path:"package"},{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"}
  ,{path:'recentContent',populate:{path:"tags"}},{path:"toolsToTry",populate:{path:"tags"}},{path:"topTools",populate:{path:"tags"}},{path:"favourites",populate:{path:"tags"}},{path:'package'}])

  res.status(200).json({
    status: 'success',
    data:foundUser
  });
});

exports.statistics = catchAsync(async (req, res, next) => {

  const [totalUsers,blockedUsers,totalVideos,totalPaidUsers,totalUnpaidUsers]=await Promise.all([
    User.countDocuments({isPaymentDone:{$in:[true,false]},isVerified:true,isActive:{$in:[true,false]}}),
    User.countDocuments({isPaymentDone:true,isVerified:true,isActive:false}),
    Video.countDocuments(),
    User.countDocuments({isPaymentDone:true,isVerified:true,isActive:{$in:[true,false]}}),
    User.countDocuments({isPaymentDone:false,isVerified:true,isActive:{$in:[true,false]}}),
    // User.countDocuments(),
  ])

  const tools=await Video.find({videoType:"tool"}).populate({path:"comments"}).sort({"comments.rating":-1})
  const groundworks=await Video.find({videoType:"groundwork"}).populate({path:"comments"}).sort({"comments.rating":-1})
  const blooms=await Video.find({videoType:"bloom"}).populate({path:"comments"}).sort({"comments.rating":-1})
  const lastMonthDate=moment().subtract(1,"month").format();
  const date=new Date(lastMonthDate)

  const resonanceFinderUsers=await User.find({"resonanceResult.averageScore":{$gt:0},resonanceResultDate:{$gt:date}}).populate({path:'avatar'})
  const mostViewedTeachers=await User.find({role:"teacher"}).sort({viewsCount:-1})
  const users=await User.find({bloom:{$ne:null},role:"users"})

  const usersBloomPercentageTotal=users.reduce((accumulator, currentValue) => accumulator + currentValue.bloomPercentage, 0);
  const averageBloomPercentage=(usersBloomPercentageTotal/(users.length*100))*100;
  const totalBloomsCheck=await User.aggregate(
    [
      {
        '$match':{role:"user"}
      },
          {
            '$lookup': {
              'from': 'blooms', 
              'localField': 'bloom', 
              'foreignField': '_id', 
              'as': 'bloom'
            }
          }, {
            '$unwind': {
              'path': '$bloom'
            }
          }, {
            '$group': {
              '_id': '$bloom._id', 
              '_id': {
                'title': '$bloom.title'
              }, 
              'count': {
                '$sum': 1
              }
            }
          }, {
            '$project': {
              'title': '$_id.title', 
              'count': 1, 
              '_id': 0
            }
          }
        ]
  )

  res.status(200).json({
    status: 'success',
    data:{
      totalUsers:totalUsers || 0,
      totalPaidUsers:totalPaidUsers || 0,
      totalUnpaidUsers:totalUnpaidUsers || 0,
      blockedUsers:blockedUsers || 0,
      totalVideos:totalVideos || 0,
      tools,
      groundworks,
      blooms,
      averageBloomPercentage:averageBloomPercentage || 0,
      totalBloomsCheck,
      resonanceFinderUsers,
      mostViewedTeachers:mostViewedTeachers || []
    }
  });
});

exports.verifyForgotPasswordOtp = catchAsync(async (req, res, next) => {
  const { email, otpCode } = req.body;
  const doc = await User.findOneAndUpdate({ email, passwordResetCode:otpCode }, { passwordResetCode:null}, { new: true });

  if (!doc) return next(new AppError('Invalid Code'), 400);

  res.status(200).json({
    status: 'success',
    data: doc
  });
});

exports.resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const otpCode = Math.floor(1000 + Math.random() * 9000)

  const updatedUser = await User.findOneAndUpdate({email}, { verificationCode: otpCode }, { new: true })

  if(!updatedUser)return next (new AppError("Error while sending",400))

  const payload = {
    msg: `Your new Confirmation Code is ${otpCode}`,
  };

  await new Email(updatedUser).sendUserRegisterEmail(payload);

  res.status(200).json({
    status: "success",
    message: 'Otp Successfully Resend',
    data: updatedUser
  });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { token } = req.query;
  const { token1 } = req.params;

  res.render('password-page', { token });
  // res.render('thankyou', { token });
});

exports.resetPasswordDone = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  // const hashedToken = crypto
  //   .createHash('sha256')
  //   .update(req.params.token)
  //   .digest('hex');

  const user = await User.findOne({
    email: req.body.email,
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Invalid Email', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  // await new Email(user, (resetURL = '')).sendPasswordResetComfirmation();
  // await sendPasswordResetComfirmation(neUser);

  // res.render('thankyou');

  createSendToken(user, 200, req, res, 'resetPasswordDone');
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select(
    '+password +isVerified +wallet'
  );

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});
