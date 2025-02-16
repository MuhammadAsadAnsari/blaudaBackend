const Category = require('../models/categoryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteFile } = require('../utils/s3');
const User = require('../models/userModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment=require('moment');

exports.getAllCategories = catchAsync(async (req, res, next) => {
 
  
  const doc = await Category.find({}).sort('-updatedAt -createdAt')

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc,
  });
});

exports.getAllCategoriesForAdmin = catchAsync(async (req, res, next) => {
  // for pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;
  const { noPagination, status } = req.query;
  let query = { isActive: status };

  const doc =
    noPagination == true
      ? await Category.find(query).sort('-updatedAt -createdAt')
      : await Category .find(query)
          .sort('-updatedAt -createdAt')
          .skip(skip)
          .limit(limit);

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc,
  });
});

exports.createCategory= catchAsync(async (req, res, next) => {
  const files =req.files;

  if(files?.icon)req.body.icon=files?.icon[0].key;

  const doc = await Category.create(req.body);

  res.status(201).json({
    status: 'success',
    data: doc,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const files=req.files;

  const count = await Category.findById(id);

  if (!count) {
    return next(new AppError('No Category Found', 400));
  }

  if(files?.icon)req.body.icon=files?.icon[0].key;

  const updatedCategory =await Category.findOneAndUpdate(
    { _id: id },
    req.body,
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: updatedCategory,
  });
});

exports.getSingleCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  res.status(200).json({
    status: 'success',
    data: category,
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  await Category.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    message: 'Category deleted successfully',
  });
});