const ResonanceFinder = require('../models/resonanceFinderModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {getUploadingSignedURL,deleteVideo,deleteFile}=require('../utils/s3');
const User = require('../models/userModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

exports.createResonanceFinder = catchAsync(async (req, res, next) => {
  const files = req.files;
  const {isVideo}=req.body;
  let url="";

  if (files?.thumbnail) req.body.thumbnail = files?.thumbnail[0].key;

  if (['true', true].includes(isVideo)) {
    const key = `${uuidv4()}-video.mp4`;
    url = await getUploadingSignedURL(key, 15004);
    req.body.video = `${process.env.AWS_VIDEO_BUCKET_LINK}${key}`;
  }

  const doc = await ResonanceFinder.create(req.body);

  res.status(201).json({
    status: 'success',
    data:{data:doc,url},
  });
});

exports.updateResonanceFinder = catchAsync(async (req, res, next) => {
  const files = req.files;
  const {isVideo}=req.body;
  let url="";

  if (files?.thumbnail) req.body.thumbnail = files?.thumbnail[0].key;

  if (['true', true].includes(isVideo)) {
    const key = `${uuidv4()}-video.mp4`;
    url = await getUploadingSignedURL(key, 15004);
    req.body.video = `${process.env.AWS_VIDEO_BUCKET_LINK}${key}`;
  }

  const updatedResonanceFinder = await ResonanceFinder.findOneAndUpdate(
    {key:"resonance-finder"},
    req.body,
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data:{data:updatedResonanceFinder,url},
  });
});

exports.getResonanceFinder = catchAsync(async (req, res, next) => {

  const resonanceFinder = await ResonanceFinder.findOne({key:"resonance-finder"});

  res.status(200).json({
    status: 'success',
    data: resonanceFinder,
  });
});