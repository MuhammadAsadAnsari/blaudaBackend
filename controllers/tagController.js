const Tag = require('../models/tagModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllTags = catchAsync(async (req, res, next) => {
  let query={
    isActive:true,
  }
  const data = await Tag.find(query);
  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getAllTagsForAdmin = catchAsync(async (req, res, next) => {
  const {search}=req.query;

  let query={
    isActive:true
  }

  if (search && search != '')
  query = {
    ...query,
    $or: [
      { name: { $regex: search, $options: 'i' } },
    ],
  };

  const data = await Tag.find(query);
  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.createTag = catchAsync(async (req, res, next) => {
  const doc = await Tag.create(req.body);

  res.status(201).json({
    status: 'success',
    data: doc,
  });
});

exports.updateTag = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) return next(new AppError('Tag Not Found.', 401));

  const updatedTag = await Tag.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedTag,
  });
});

exports.deleteTag = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) return next(new AppError('Tag Not Found.', 401));

  const deletedTag = await Tag.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    data: deletedTag,
  });
});

exports.getTagDetail = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) return next(new AppError('Tag Not Found.', 401));

  const tag = await Tag.findById(id);

  res.status(200).json({
    status: 'success',
    data: tag,
  });
});

