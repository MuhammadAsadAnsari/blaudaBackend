import { promisify } from 'util';
import jwt, { JwtPayload } from 'jsonwebtoken';
import moment from 'moment';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { NextFunction, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../models/userEntity';
import { AppDataSource } from '../server';
import bcrypt from 'bcrypt';
import { IUser } from '../interfaces/userInterface';

const getUserRepo = (): Repository<User> => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database is not initialized yet!');
  }
  return AppDataSource.getRepository(User);
};
const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
  });
};

const expireToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: 5,
  });
};

const createSendToken = (
  user: User | null,
  statusCode: any,
  req: Request,
  res: Response,
  resetPasswordDone: any
) => {
  const token = signToken(String(user?.id));
console.log('token', process.env.JWT_COOKIE_EXPIRES_IN);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove password from output

delete user?.password

  res.status(statusCode).json({
    status: 'success',
    token,
    ...(resetPasswordDone && { isLoggedIn: true }),
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
 const { name, email, password, role } = req.body;

 // Validate request body
 if (!name || !email || !password || !role)  return next(new AppError('User already Exist.', 400));


 const userRepo: Repository<User> = getUserRepo();

 const foundUser =await userRepo.findOne({where:{email}})
 
 if(foundUser) return next(
   new AppError('User already Exist.', 400)
 );
 // Hash the password
 const saltRounds = 10;
 const hashedPassword = await bcrypt.hash(password, saltRounds);

 // Create new user instance with the hashed password
 const newUser = userRepo.create({
   name,
   email,
   password: hashedPassword,
   role,
 });

 // Save user to the database
 await userRepo.save(newUser);
 
 createSendToken(newUser, 201, req, res,false); 

});



// Admin login
export const adminLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log("🚀 ~ exports.adminLogin=catchAsync ~ role:")

  if(!email || !password) return next(new AppError('All fields required.',400))


  
console.log("AAA")
  const userRepo: Repository<User> = getUserRepo();
  const isUserAlreadyExist = await userRepo.findOne({
    where: { email },
    select: ['id','name','email','password','role','photo']
  });

  console.log(
    '🚀 ~ exports.adminLogin=catchAsync ~ isUseralreadyExist:',
    isUserAlreadyExist
  );
  if (!isUserAlreadyExist)
    return next(new AppError('No user is specified with this email.', 401));

  let user: User | null = isUserAlreadyExist;
 
  if (user.role === 'user') return next(new AppError('Not a user route.', 401));

  if (!user.password) {
    return next(new AppError('Password not found', 500));
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log("🚀 ~ adminLogin ~ isPasswordValid:", isPasswordValid)

  if (!isPasswordValid) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  const token = signToken(String(user?.id));
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  // Remove password from output
  delete user.password;

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

export const logout = catchAsync(async (req: any, res: Response) => {
  //     const { token } = req.body;
  //     // await User.findByIdAndUpdate(req.user._id, {
  //     //   // lastLogin: Date.now(),
  //     //   // $pull: { fcmToken: token },
  //     //   isOnline:false
  //     //   // $push: { loginHistory: logoutObject },
  //     // });
  //     res.cookie('jwt', 'loggedout', {
  //       expires: new Date(Date.now() + 10 * 1000),
  //       httpOnly: true,
  //     });
  //     const expiredToken = expireToken(req.user?._id);
  //     res.status(200).json({ status: 'success', data: expiredToken });
});

export const protect = catchAsync(async (req:IUser , res, next) => {
  // 1) Getting token and check of it's there
  console.log("inside protect")
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

  console.log(token);

  // 2) Verification token
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
  
  console.log("🚀 ~ exports.protect=catchAsync ~ decoded:",typeof decoded)

  // 3) Check if user still exists
   const userRepo: Repository<User> = getUserRepo();

   const currentUser = await userRepo.findOne({
    where: { id: Number(decoded?.id) },
  });

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError('User recently changed password! Please log in again.', 401)
  //   );
  // }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      // const verifyAsync = promisify(jwt.verify);
      //  const decoded = await verifyAsync(req.cookies.jwt, process.env.JWT_SECRET);

      // 2) Check if user still exists
      const currentUser = 'await User.findById(decoded.id)';
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      // if (currentUser.changedPasswordAfter(decoded.iat)) {
      //   return next();
      // }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

export const restrictTo = (...roles: any) => {
  return (req: IUser, res: Response, next: NextFunction) => {
  
    if(!req.user) return next(new AppError('Not authorized to perform this action', 401))

    console.log('req.user.role', req.user.role, { roles });
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next: NextFunction) => {
  // 1) Get user based on POSTed email
  let user = 'await User.findOne({ email: req.body.email })';
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 3) Send it to user's email
  try {
    const code = Math.floor(100000 + Math.random() * 900000);
    const resetCode = 'Your password resetcode is ' + code;

    user = '';

    res.status(200).json({
      status: 'success',
      message: 'Code sent to email!',
    });
  } catch (err) {
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

export const verifyMe = catchAsync(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  let updatedUser =
    ' await User.findOneAndUpdate({ email, verificationCode }, { isVerified: true }, { new: true })';

  if (!updatedUser) return next(new AppError('Invalid Verification Code', 500));

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

export const me = catchAsync(async (req:IUser, res, next) => {

  console.log("req.user",req.user)
  const user=  req.user;
  
  const userRepo: Repository<User> = getUserRepo();

  const foundUser = await userRepo.findOne({
    where: { id: user?.id },
    select: ['id', 'email', 'password', 'role','name','photo'],
  });
   res.status(200).json({
     status: 'success',
     data: foundUser,
   });
});

export const verifyForgotPasswordOtp = catchAsync(async (req, res, next) => {
  const { email, otpCode } = req.body;
  const doc =
    ' await User.findOneAndUpdate({ email, passwordResetCode:otpCode }, { passwordResetCode:null}, { new: true })';

  if (!doc) return next(new AppError('Invalid Code', 400));

  res.status(200).json({
    status: 'success',
    data: doc,
  });
});

export const resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const otpCode = Math.floor(1000 + Math.random() * 9000);

  const updatedUser =
    'await User.findOneAndUpdate({email}, { verificationCode: otpCode }, { new: true })';

  if (!updatedUser) return next(new AppError('Error while sending', 400));

  res.status(200).json({
    status: 'success',
    message: 'Otp Successfully Resend',
    data: updatedUser,
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.query;
  const { token1 } = req.params;

  res.render('password-page', { token });
  // res.render('thankyou', { token });
});

export const resetPasswordDone = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  // const hashedToken = crypto
  //   .createHash('sha256')
  //   .update(req.params.token)
  //   .digest('hex');

  const user = '';

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Invalid Email', 400));
  }
  // user.password = req.body.password;
  // user.passwordConfirm = req.body.passwordConfirm;
  // user.passwordResetToken = undefined;
  // user.passwordResetExpires = undefined;

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  // await new Email(user, (resetURL = '')).sendPasswordResetComfirmation();
  // await sendPasswordResetComfirmation(neUser);

  // res.render('thankyou');

  createSendToken(user, 200, req, res, 'resetPasswordDone');
});

export const updatePassword = catchAsync(async (req: IUser, res, next) => {
  // 1) Get user from request
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new AppError('All fields are required.', 400));
  }

  if (newPassword !== confirmNewPassword) {
    return next(
      new AppError('New password and confirm password do not match.', 400)
    );
  }

  const user = req.user;
  const userRepo: Repository<User> = getUserRepo();

  const foundUser = await userRepo.findOne({
    where: { email: user?.email },
    select: ['id', 'name','email','password','role','photo'], // Ensure 'id' is included
  });

  if (!foundUser) {
    return next(new AppError('User not found.', 404));
  }

  // 2) Check if provided current password is correct
  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    String(foundUser.password)
  );
  if (!isPasswordValid) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  // 3) Update password with hashing
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await userRepo.update(foundUser.id, { password: hashedPassword });

    delete foundUser.password;
  // 4) Respond to client
  createSendToken(foundUser, 200, req, res,true);
});


