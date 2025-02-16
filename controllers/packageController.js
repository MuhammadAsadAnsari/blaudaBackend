const Package = require('../models/packageModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteFile } = require('../utils/s3');
const User = require('../models/userModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment=require('moment');

exports.getAllPackages = catchAsync(async (req, res, next) => {
  // for pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;
  const { noPagination } = req.query;
  let query = {};

  const doc =
    noPagination == true
      ? await Package .find(query)
          .sort('-updatedAt -createdAt')
      : await Package.find(query)
          .sort('-updatedAt -createdAt')
          .skip(skip)
          .limit(limit);

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc,
  });
});

exports.getAllPackagesForAdmin = catchAsync(async (req, res, next) => {
  // for pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;
  const { noPagination, status } = req.query;
  let query = { isActive: status };

  const doc =
    noPagination == true
      ? await Package.find(query).sort('-updatedAt -createdAt')
      : await Package .find(query)
          .sort('-updatedAt -createdAt')
          .skip(skip)
          .limit(limit);

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc,
  });
});

exports.createPackage= catchAsync(async (req, res, next) => {
  const doc = await Package.create(req.body);

  res.status(201).json({
    status: 'success',
    data: doc,
  });
});

exports.updatePackage = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const count = await Package.findById(id);

  if (!count) {
    return next(new AppError('No Package Found', 400));
  }

  const updatedPackage =await package.findOneAndUpdate(
    { _id: id },
    req.body,
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: updatedPackage,
  });
});

exports.deletePackage = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  await Package.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    message: 'Package deleted successfully',
  });
});

exports.singlePackage = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const package=await Package.findById(id);

  res.status(200).json({
    status: 'success',
    data:package
  });
});

exports.buyPackage = catchAsync(async (req, res, next) => {
  const {packageId,type,pmId} = req.body;
  const {user}=req;

  if( user?.isPaymentDone)return next(new AppError("Package Already Purchased",400));

  const packageDetails=await Package.findById(packageId);
  if(type=="mob")
  {
    // STRIPE charge CODE HERE
  const payment = await stripe.paymentIntents.create({
    amount:packageDetails?.price * 100,
    currency: 'usd',
    payment_method: pmId,
    payment_method_types: ['card'],
    customer: user?.cus,
  });

  // confirmming the payment intent
  const paymentConfirm = await stripe.paymentIntents.confirm(payment.id);

  if (paymentConfirm.status !== 'succeeded')
    return next(new AppError('Stripe payment error.', 400));

    let packageStartDate,packageEndDate;
    if(packageDetails?.name=='Monthly'){
      packageStartDate=Date.now()
      packageEndDate=moment().add(1,'Month').format();
    }
    else{
      packageStartDate=Date.now()
      packageEndDate=moment().add(1,'Year').format();
    }

    const updatedUser= await User.findByIdAndUpdate(
      user?._id,
      {
      isPaymentDone:true,
       package:packageId,
       packageStartDate,
       packageEndDate
      },
      { new: true }
    );

res.status(200).json({
status: 'success',
data:{user:updatedUser}
});
  }
  else{
    const session = await stripe.checkout.sessions.create({
      success_url: 'https://vibe-garden-web-xi.vercel.app/payment-success',
      cancel_url: 'https://vibe-garden-web-xi.vercel.app/payment-failure',
      line_items: [
        {price:packageDetails?.price * 100, quantity: 1},
      ],
      mode: 'payment',
    });
      
     const updatedUser= await User.findByIdAndUpdate(
        user?._id,
        {
        //  isPaymentDone:true,
        //  packageStartDate:Date.now(),
         package:packageId
        },
        { new: true }
      );

res.status(200).json({
  status: 'Payment Successfully Done ',
  data:{user:updatedUser,url:session?.url}
});
  }   
});
