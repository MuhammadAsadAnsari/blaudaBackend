const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteFile } = require('../utils/s3');
const NewsLetter = require('../models/newsLetterModel');

exports.getAllNewsLettersForAdmin = catchAsync(async (req, res, next) => {
  // for pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;
  const { noPagination } = req.query;
  let query = {};

  const doc =
    noPagination == true
      ? await NewsLetter.find(query).sort('-updatedAt -createdAt')
      : await NewsLetter.find(query)
          .sort('-updatedAt -createdAt')
          .skip(skip)
          .limit(limit);

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc,
  });
});

exports.createNewsLetter= catchAsync(async (req, res, next) => {
  const doc = await NewsLetter.create(req.body);

  res.status(201).json({
    status: 'success',
    data: doc,
  });
});