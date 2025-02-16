const TermAndCondition = require('../models/termsAndConditionsModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getTermsAndConditions = catchAsync(async (req, res, next) => {

  const _TermAndCondition = await TermAndCondition.findOne({heading:'Terms And Conditions'});
  res.status(200).json({
    status: 'success',
    data: _TermAndCondition,
  });
});

exports.createTermsAndConditions = catchAsync(async (req, res, next) => {
  const _TermAndCondition = await TermAndCondition.create(req.body);

  res.status(201).json({
    status: 'success',
    data: _TermAndCondition,
  });
});

exports.updateTermsAndConditions = catchAsync(async (req, res, next) => {

  const _TermAndCondition = await TermAndCondition.findOneAndUpdate(
    {heading:'Terms And Conditions'},
    req.body,
    {
      new: true,
    }
  );
  res.status(200).json({
    status: 'success',
    data: _TermAndCondition,
  });
});

