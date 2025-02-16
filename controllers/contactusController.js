const ContactUs = require('../models/contactusModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

exports.getAllContactusForAdmin = catchAsync(async (req, res, next) => {

  const doc = await ContactUs.find().sort({createAt:-1})

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc,
  });
});

exports.createContactus= catchAsync(async (req, res, next) => {

  const {firstName,lastName,email,message}=req.body;

  if(!firstName || !lastName || !email || !message)return next(new AppError("Missing arguments",400))

  const doc = await ContactUs.create(req.body);

  res.status(201).json({
    status: 'success',
    data: doc,
  });
});