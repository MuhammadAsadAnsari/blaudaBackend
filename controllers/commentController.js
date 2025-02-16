const Comment = require('../models/commentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Video = require('../models/videoModel');

exports.getAllCommentsForAdmin = catchAsync(async (req, res, next) => {
  const { status, commentType } = req.query;

  let query = {
    status,
    commentType
  }

  if (status == "all") {
    query = {
      status: { $in: ['pending', 'approved', 'trash', 'unapproved'] },
      commentType
    }
  }

  const doc = await Comment.find(query).populate([{ path: 'video' }, { path: 'user' }]).sort({ createAt: -1 })
  const allCount=await Comment.countDocuments({status: { $in: ['pending', 'approved', 'trash'] },commentType})
  const pendingCount=await Comment.countDocuments({status: { $in: ['pending'] },commentType})
  const approvedCount=await Comment.countDocuments({status: { $in: ['approved'] },commentType})
  const trashCount=await Comment.countDocuments({status: { $in: ['trash'] },commentType})

  res.status(200).json({
    status: 'success',
    allCount:allCount || 0,
    pendingCount:pendingCount || 0,
    approvedCount:approvedCount || 0,
    trashCount:trashCount || 0,
    results: doc.length,
    data: doc,
  });
});

exports.updateCommentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let deletedComment;

  if (req.body.status == "restore" || req.body.status == "unapproved") {
    req.body.status = "pending"
  }

  if (req.body.status == 'delete') 
  {
    deletedComment = await Comment.findByIdAndDelete(id)
    if (!deletedComment) return next(new AppError("Comment Not Deleted", 400))

    res.status(200).json({
      status: 'success',
      data: deletedComment,
    });
  }
  else 
  {
    const updatedComment = await Comment.findByIdAndUpdate(id, req.body, { new: true }).populate([{ path: 'video' }, { path: 'user' }])

  await User.findByIdAndUpdate(updatedComment?.user,{$addToSet:{topTools:updatedComment?.video}})

  const comments=await Comment.find({video:updatedComment?.video})

  const sumOfRatings = comments.reduce((accumulator, currentValue) => accumulator + currentValue.rating, 0)

  const averageRating=sumOfRatings/comments.length;

  const updatedVideo=await Video.findByIdAndUpdate(updatedComment?.video,{$addToSet:{comments:updatedComment?._id},averageRating},{new:true})

    res.status(200).json({
      status: 'success',
      data: updatedComment,
    });
  }
});

exports.createComment = catchAsync(async (req, res, next) => {

  const { user } = req;

  const { rating, videoId, comment, commentType } = req.body;

  if (!rating || !videoId || !comment || !commentType) return next(new AppError("Missing arguments", 400))

  const foundComment=await Comment.findOne({user:user?._id,video:videoId})

  if(foundComment)return next(new AppError("You have already reviewed this video!",400))

  const obj = {
    user: user?._id,
    rating,
    video: videoId,
    comment,
    commentType
  }

  const doc = await Comment.create(obj);

  // const comments=await Comment.find({video:doc?.video})

  // const sumOfRatings = comments.reduce((accumulator, currentValue) => accumulator + currentValue.rating, 0)

  // const averageRating=sumOfRatings/comments.length;

  // const updatedVideo=await Video.findByIdAndUpdate(videoId,{$push:{comments:doc?._id},averageRating},{new:true})

  const updatedUser=await User.findById(user?._id).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"}
  ,{path:'recentContent'},{path:"toolsToTry"},{path:"topTools"},{path:"favourites"}])

  res.status(201).json({
    status: 'success',
    data: {data:doc,user:updatedUser},
  });
});