const Page = require('../models/crudModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteImage } = require('../utils/s3');

exports.getPageData = async (req, res, next) => {
  // const secName = req.query.secName;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;

  const data = await Page.find()
    .sort('-createdAt -updatedAt')
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: 'success',
    data,
  });
};

exports.addPageData = async (req, res, next) => {
  let { files } = req;
  
  if (files?.image) {
    req.body.image = files?.image[0].key;
  }

  if (files?.coverImage) {
    req.body.coverImage = files?.coverImage[0].key;
  }

  const data = await Page.create(req.body);

  res.status(201).json({
    status: 'success',
    data,
  });
};

exports.updatePageData = async (req, res, next) => {
  const { id } = req.params;
  let { files } = req;

  if (!id) return next(new AppError('Id is missing', 400));

  const foundData = await Page.findOne({ _id: id });

  if (files?.image) {
    if (foundData?.image) await deleteImage(foundData?.image);
    req.body.image = files?.image[0].key;
  }

  if (files?.coverImage) {
    if (foundData?.coverImage) await deleteImage(foundData?.coverImage);
    req.body.coverImage = files?.coverImage[0].key;
  }

  const data = await Page.findByIdAndUpdate(id, req.body, { new: true });

  res.status(200).json({
    status: 'success',
    data,
  });
};

exports.deletePageData = async (req, res, next) => {
  const { id } = req.params;

  if (!id) return next(new AppError('Id is missing', 400));

  const foundData = await Page.findOne({ _id: id });

  if (foundData?.image) await deleteImage(foundData?.image);

  if (foundData?.coverImage) await deleteImage(foundData?.coverImage);

  await Page.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
  });
};
