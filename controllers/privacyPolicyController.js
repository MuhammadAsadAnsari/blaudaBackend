const PrivacyPolicy = require('../models/privacyPolicyModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getPrivacyPolicy = catchAsync(async (req, res, next) => {

  const privacyPolicy = await PrivacyPolicy.findOne({heading:'Privacy Policy'});
  res.status(200).json({
    status: 'success',
    data: privacyPolicy,
  });
});

exports.createPrivacyPolicy = catchAsync(async (req, res, next) => {
  const privacyPolicy = await PrivacyPolicy.create(req.body);

  res.status(201).json({
    status: 'success',
    data: privacyPolicy,
  });
});

exports.updatePrivacyPolicy = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) return next(new AppError('Privacy policy Id is undefined.', 401));

  const privacyPolicy = await PrivacyPolicy.findOneAndUpdate({heading:'Privacy Policy'}, req.body, {
    new: true,
  });
  res.status(200).json({
    status: 'success',
    data: privacyPolicy,
  });
});

