const Video = require('../models/videoModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { getUploadingSignedURL, deleteVideo } = require('../utils/s3');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel');
const Tag = require('../models/tagModel');
const Category = require('../models/categoryModel');

exports.getAllVideos = catchAsync(async (req, res, next) => {
  const { videoType,search } = req.query;

  let query={
    videoType
  }

  if (search && search != '')
  query = {
    ...query,
    $or: [
      { title: { $regex: search, $options: 'i' } },
    ],
  };

  const data = await Video.find(query).populate([{ path: 'tags' },{path:"teachers.teacherId"},{path:"comments",populate:{path:'user'}},{path:'relatedContent'}]);

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getAllVideosByType = catchAsync(async (req, res, next) => {
  const { videoType } = req.query;

  // const data = await Video.find({ videoType }).populate({ path: 'tags' });
  const data = await Video.aggregate([
    {
      '$match': {
        'videoType': videoType
      }
    }, {
      '$group': {
        '_id': '$category', 
        '_id': {
          '_id': '$_id', 
          'category': '$category', 
          'title': '$title', 
          'videoType': '$videoType', 
          'description': '$description', 
          'thumbnail': '$thumbnail', 
          'video': '$video', 
          'isFeatured': '$isFeatured', 
          'isRecommended': '$isRecommended', 
          'tags': '$tags', 
          'relatedContent': '$relatedContent', 
          'teachers': '$teachers', 
          'additionalResources': '$additionalResources', 
          'createdAt': '$createdAt', 
          'updatedAt': '$updatedAt'
        }
      }
    }, {
      '$lookup': {
        'from': 'categories', 
        'localField': '_id.category', 
        'foreignField': '_id', 
        'as': '_id.category'
      }
    }, {
      '$unwind': {
        'path': '$_id.category'
      }
    }, {
      '$group': {
        '_id': {
          'title': '$_id.category.title', 
          'description': '$_id.category.description', 
          'videoType': '$_id.videoType'
        }, 
        'videos': {
          '$push': '$_id'
        }
      }
    }, {
      '$project': {
        'categoryName': '$_id.title', 
        'description': '$_id.description', 
        'videoType': '$_id.videoType', 
        'videos': 1
      }
    }, {
      '$unwind': {
        'path': '$videos'
      }
    }, {
      '$lookup': {
        'from': 'tags', 
        'localField': 'videos.tags', 
        'foreignField': '_id', 
        'as': 'videos.tags'
      }
    }, {
      '$group': {
        '_id': {
          'title': '$categoryName', 
          'description': '$description', 
          'videoType': '$videoType'
        }, 
        'videos': {
          '$push': '$videos'
        }
      }
    }, {
      '$project': {
        'categoryName': '$_id.title', 
        'description': '$_id.description', 
        'videoType': '$_id.videoType', 
        'videos': 1
      }
    }
  ]
  )

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getAllRecommendedVideos = catchAsync(async (req, res, next) => {
  const {search}=req.query;

  let query={
    isRecommended: true
  }

  if (search && search != '')
  query = {
    ...query,
    $or: [
      { title: { $regex: search, $options: 'i' } },
    ],
  };

  const data = await Video.find(query).populate([{ path: 'tags' },{path:'relatedContent',populate:{path:'tags'}},{path:'recommendedContent',populate:{path:'tags'}}]).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getAllFeaturedVideos = catchAsync(async (req, res, next) => {
  const { videoType,search } = req.query;

  let query={
    isFeatured: true, videoType
  }

  if (search && search != '')
  query = {
    ...query,
    $or: [
      { title: { $regex: search, $options: 'i' } },
    ],
  };

  const data = await Video.find(query).populate([{path:'recommendedContent',populate:{path:'tags'}},{path:'relatedContent',populate:{path:"tags"}},{ path:'tags'},{path:"category"},{path:"teachers"},{path:'comments',populate:{path:'user'}}]).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getAllVideosForAdmin = catchAsync(async (req, res, next) => {
  const {videoType}=req.query;
  const data = await Video.find(videoType && {videoType}).populate({path:"tags"});

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.createVideo = catchAsync(async (req, res, next) => {
  const { isVideo } = req.body;
  const files = req.files;
  let url;

  const parsedTags = JSON.parse(req.body.tags)
  req.body.tags = parsedTags;

  if (files?.thumbnail) {
    req.body.thumbnail = files?.thumbnail[0].key;
  }

  if(!req.body.category && req.body.videoType!='bloom')return next(new AppError("Category is required",400))
  if(!req.body.title)return next(new AppError("Video Title is required",400))
  if(!req.body.description)return next(new AppError("Description is required",400))

  if(req.body.relatedContent)
  {
    req.body.relatedContent=JSON.parse(req.body.relatedContent)
  }

  if(req.body.additionalResources)
  {
    req.body.additionalResources=JSON.parse(req.body.additionalResources)
  }

  if(req.body.teachers)
  {
    req.body.teachers=JSON.parse(req.body.teachers)
  }

  if (['true', true].includes(isVideo)) {
    const key = `${uuidv4()}-video.mp4`;
    url = await getUploadingSignedURL(key, 15004);
    req.body.video = `${process.env.AWS_VIDEO_BUCKET_LINK}${key}`;
  }

  req.body.postedDate=new Date();
  const doc = await Video.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { data: doc, url },
  });
});

exports.updateVideo = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isVideo } = req.body;
  const files = req.files;
  let url;

  const foundVideo = await Video.findById(id);

  if (!foundVideo) return next(new AppError('Video Not Found.', 400));

  if (files?.thumbnail) {
    req.body.thumbnail = files?.thumbnail[0].key;
  }

  if(req.body.relatedContent)
  {
    req.body.relatedContent=JSON.parse(req.body.relatedContent)
  }

  if(req.body.additionalResources)
  {
    req.body.additionalResources=JSON.parse(req.body.additionalResources)
  }

  if(req.body.teachers)
  {
    req.body.teachers=JSON.parse(req.body.teachers)
  }


  if (['true', true].includes(isVideo)) {
    // if (foundVideo?.video) {
    //   await deleteVideo(foundVideo?.video);
    // }
    const key = `${uuidv4()}-video.mp4`;
    url = await getUploadingSignedURL(key, 15004);
    req.body.video = `${process.env.AWS_VIDEO_BUCKET_LINK}${key}`;
  }

  if (req.body.tags) {
    const parsedTags = JSON.parse(req.body.tags)
    req.body.tags = parsedTags;
  }
  const updatedVideo = await Video.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  console.log("🚀 ~ file: videoController.js:283 ~ exports.updateVideo=catchAsync ~ updatedVideo:", updatedVideo)

  res.status(200).json({
    status: 'success',
    data: { data: updatedVideo, url },
  });
});

exports.featuredTools = catchAsync(async (req, res, next) => {
  const { featuredToolIds } = req.body;
  const updatedToolVideos = [];

  await Promise.all(
    featuredToolIds.map(async (ele) => {
      const updatedToolVideo = await Video.findByIdAndUpdate(ele, { isFeatured: true }, { new: true })
      updatedToolVideos.push(updatedToolVideo)
    })
  )

  res.status(200).json({
    status: 'success',
    data: updatedToolVideos,
  });
});

exports.featuredGroundwork = catchAsync(async (req, res, next) => {
  const { featuredGroundworkIds } = req.body;
  const updatedGroundworkVideos = [];

  await Promise.all(
    featuredGroundworkIds.map(async (ele) => {
      const updatedGroundworkVideo = await Video.findByIdAndUpdate(ele, { isFeatured: true }, { new: true })
      updatedGroundworkVideos.push(updatedGroundworkVideo)
    })
  )

  res.status(200).json({
    status: 'success',
    data: updatedGroundworkVideos,
  });
});

exports.recommendVideo = catchAsync(async (req, res, next) => {
  const { recommendVideoIds } = req.body;
  const updatedVideos = [];

  await Promise.all(
    recommendVideoIds.map(async (ele) => {
      const updatedVideo = await Video.findByIdAndUpdate(ele, { isRecommended: true }, { new: true })
      updatedVideos.push(updatedVideo)
    })
  )

  res.status(200).json({
    status: 'success',
    data: updatedVideos,
  });
});

exports.deleteVideo = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const deletedVideo = await Video.findByIdAndDelete(id, req.body, {
    new: true,
  });

  res.status(200).json({
    status: 'success',
    data: deletedVideo,
  });
});

exports.getSingleVideoData = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const foundVideo = await Video.findById(id).populate([{ path:'tags'},{path:"category"},{path:"teachers.teacherId"},{path:'comments',populate:{path:'user',populate:{path:"avatar"}}},{path:'relatedContent',populate:{path:"tags"}},{path:'recommendedContent',populate:{path:'tags'}}])

  if (!foundVideo) return next(new AppError('Video Not Found.', 401));

  const filteredComments=await foundVideo?.comments.filter(ele=>ele.status=="approved")

  foundVideo.comments=filteredComments;

  res.status(200).json({
    status: 'success',
    data: foundVideo,
  });
});

exports.getVideosByTagId = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const foundTag = await Tag.findById(id)

  if (!foundTag) return next(new AppError('Tag Not Found.', 401));

  const videos=await Video.find({tags:{$in:[id]}})

  res.status(200).json({
    status: 'success',
    data: videos,
  });
});

exports.getVideosByCategoryId = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {type}=req.query;

  const foundCategory = await Category.findById(id)

  if (!foundCategory) return next(new AppError('Category Not Found.', 401));

  const videos=await Video.find({category:id,videoType:type})

  res.status(200).json({
    status: 'success',
    data: videos,
  });
});

exports.addToRecentContent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {status}=req.body;
  const {user}=req;

  const foundVideo = await Video.findById(id)

  if (!foundVideo) return next(new AppError('Video Not Found.', 401));

  if(user?.recentContent.length==5 && !user?.isPaymentDone)
  {
    return next(new AppError("Max Limit Reached!Kindly purchase our Package",400))
  }

 const updatedUser=status=="remove" ? await User.findByIdAndUpdate(user?._id,{$pull:{recentContent:id}},{new:true}).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:'avatar'}, {path:'bloom'},{path:'package'},{path:"recentContent",populate:{path:"tags"}},{path:"favourites",populate:{path:"tags"}},{path:"toolsToTry",populate:{path:"tags"}},{path:"topTools",populate:{path:"tags"}}]):
 await User.findByIdAndUpdate(user?._id,{$addToSet:{recentContent:id}},{new:true}).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:'avatar'}, {path:'bloom'},{path:'package'},{path:"recentContent",populate:{path:"tags"}},{path:"favourites",populate:{path:"tags"}},{path:"toolsToTry",populate:{path:"tags"}},{path:"topTools",populate:{path:"tags"}}])

  res.status(200).json({
    status: 'success',
    data:updatedUser,
  });
});

exports.addToFavourite = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {user}=req;
  const {status}=req.body;

  const foundVideo = await Video.findById(id)

  if (!foundVideo) return next(new AppError('Video Not Found.', 401));

 const updatedUser= status=="remove" ? await User.findByIdAndUpdate(user?._id,{$pull:{favourites:id}},{new:true}).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:'avatar'}, {path:'bloom'},{path:'package'},{path:"recentContent",populate:{path:"tags"}},{path:"favourites",populate:{path:"tags"}},{path:"toolsToTry",populate:{path:"tags"}},{path:"topTools",populate:{path:"tags"}}]):
 await User.findByIdAndUpdate(user?._id,{$addToSet:{favourites:id}},{new:true}).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:'avatar'}, {path:'bloom'},{path:'package'},{path:"recentContent",populate:{path:"tags"}},{path:"favourites",populate:{path:"tags"}},{path:"toolsToTry",populate:{path:"tags"}},{path:"topTools",populate:{path:"tags"}}]);

  res.status(200).json({
    status: 'success',
    data:updatedUser,
  });
});

exports.addToToolsToTry = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {user}=req;
  const {status}=req.body;

  const foundVideo = await Video.findById(id)

  if (!foundVideo) return next(new AppError('Video Not Found.', 401));

 const updatedUser=status == "remove" ? await User.findByIdAndUpdate(user?._id,{$pull:{toolsToTry:id}},{new:true}).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:'avatar'}, {path:'bloom'},{path:'package'},{path:"recentContent",populate:{path:"tags"}},{path:"favourites",populate:{path:"tags"}},{path:"toolsToTry",populate:{path:"tags"}},{path:"topTools",populate:{path:"tags"}}]):
 await User.findByIdAndUpdate(user?._id,{$addToSet:{toolsToTry:id}},{new:true}).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:'avatar'}, {path:'bloom'},{path:'package'},{path:"recentContent",populate:{path:"tags"}},{path:"favourites",populate:{path:"tags"}},{path:"toolsToTry",populate:{path:"tags"}},{path:"topTools",populate:{path:"tags"}}]);

  res.status(200).json({
    status: 'success',
    data:updatedUser,
  });
});

exports.addToTopTools = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {user}=req;
  const {status}=req.body;

  const foundVideo = await Video.findById(id)

  if (!foundVideo) return next(new AppError('Video Not Found.', 401));

 const updatedUser= status=="remove" ? await User.findByIdAndUpdate(user?._id,{$pull:{topTools:id}},{new:true}).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:'avatar'}, {path:'bloom'},{path:'package'},{path:"recentContent"},{path:"favourites"},{path:"toolsToTry"},{path:"topTools"}]):
 await User.findByIdAndUpdate(user?._id,{$addToSet:{topTools:id}},{new:true}).populate([{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:'avatar'}, {path:'bloom'},{path:'package'},{path:"recentContent",populate:{path:"tags"}},{path:"favourites",populate:{path:"tags"}},{path:"toolsToTry",populate:{path:"tags"}},{path:"topTools",populate:{path:"tags"}}]);

  res.status(200).json({
    status: 'success',
    data:updatedUser,
  });
});

exports.uploadAudio = catchAsync(async (req, res, next) => {
  const files=req.files;

  if(files?.audio)req.body.audio=files?.audio[0].key

  const createdAudio = await Audio.create(req.body)

  res.status(200).json({
    status: 'success',
    data: createdAudio,
  });
});

