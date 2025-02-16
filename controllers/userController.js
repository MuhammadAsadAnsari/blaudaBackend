const multer = require('multer');
const moment = require('moment');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const Tag = require('../models/tagModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const { deleteImage,getUploadingSignedURL } = require('../utils/s3');
const { v4: uuidv4 } = require('uuid');
const Package = require('../models/packageModel');
const { ObjectId } = require('mongodb');
const WaitingList = require('../models/waitingListModel');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};


exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  const files = req.files;
  const {user}=req;
  console.log("🚀 ~ file: userController.js:26 ~ exports.updateMe=catchAsync ~ req:", req.body)

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  if (files?.photo) {
    req.body.photo = req?.files?.photo[0].key;
    // await deleteImage(user?.photo);
  } 

  if(req.body.resonanceResult?.selectedTagIds)
  {
    const unSelectedTagIds=await Tag.find({_id:{$nin:req.body.resonanceResult.selectedTagIds}})
    req.body.resonanceResult.unSelectedTagIds=unSelectedTagIds
  }

  if(["true",true].includes(req.body.isPaymentDone))
  {
    const packageDetails=await Package.findById(user?.package);

    if(packageDetails?.name=='Monthly'){
      req.body.packageStartDate=Date.now()
      req.body.packageEndDate=moment().add(1,'Month').format();
    }
    else{
      req.body.packageStartDate=Date.now()
      req.body.packageEndDate=moment().add(1,'Year').format();
    }
  }


  const updatedUser=await User.findByIdAndUpdate(user?._id,req.body,{new:true}).populate([{path:'avatar'},{path:'bloom'},{path:'package'},{path:"resonanceResult.selectedTagIds"},{path:"resonanceResult.unSelectedTagIds"},{path:"recentContent"},{path:"favourites"},{path:"toolsToTry"},{path:"topTools"}])

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const {id} = req.params;

  let user = await User.findById(id).populate([{path:'package'},{path:"avatar"},{path:"bloom"}]).lean()
    const bookedDates=await Booking.aggregate([
      {
        '$match': {
          'vibeGuide':new ObjectId(id),
          'status': {
            '$in': [
              'pending'
            ]
          }
        }
      }, {
        '$group': {
          '_id': {
            'date': '$bookingDate'
          }, 
          'date': {
            '$push': '$bookingTime'
          }
        }
      }, {
        '$project': {
          '_id': 0, 
          'date': '$_id.date', 
          'time': '$date'
        }
      }
    ])

  user.bookedDates=bookedDates || [];

  if(user?.role=="teacher")
  {
    user=await User.findByIdAndUpdate(id,{viewsCount:{$inc:1}})
  }

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;

  const { role,search, noPagination } = req.query;

  let query = { role};

  if (role == 'all')
    query = {
      ...query,
      role: { $in: ['user','vibe-guide','teacher'] },
    };

  if (search && search != '')
    query = {
      ...query,
      $or: [
        { teacherName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { vibeGuideName: { $regex: search, $options: 'i' } },
      ],
    };

  const users =
    noPagination && noPagination == 'true'
      ? await User.find(query)
      : await User.find(query)
          .sort('-updatedAt -createdAt')
          .skip(skip)
          .limit(limit);

  res.status(200).json({
    status: 'success',
    results: users?.length || 0,
    data: users,
  });
});

exports.getAllUsersForAdmin = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;

  const { search, noPagination } = req.query;

  let query = { role:"user",isPaymentDone:{$in:[true,false]},isVerified:true};

  if (search && search != '')
    query = {
      ...query,
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
      ],
    };

  const users =
    noPagination && noPagination == 'true'
      ? await User.find(query).populate([{path:'package'},{path:"avatar"},{path:"bloom"}])
      : await User.find(query).populate([{path:'package'},{path:"avatar"},{path:"bloom"}])
          .sort('-updatedAt -createdAt')
          .skip(skip)
          .limit(limit);

  res.status(200).json({
    status: 'success',
    results: users?.length || 0,
    data: users,
  });
});

exports.paymentSuccess = catchAsync(async (req, res, next) => {

  const updatedUser=await User.findByIdAndUpdate(req.body.id,req.body,{new:true})

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});

exports.activeDeactiveUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const status = req.body.status;

  const user = await User.findByIdAndUpdate(id,{isActive: status,},{new:true});
  
  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.adminCreateTeacher = catchAsync(async (req, res, next) => {
  const files=req.files;
  const {teacherName,description,link,isVideo}=req.body;
  let url;

  if(!teacherName || !description || !link)return next(new AppError("Missing Parameters",400));

  if(!files?.photo)return next(new AppError("Profile Photo Missing",400));

  if(files?.photo){
    req.body.photo=files?.photo[0].key;
  }

  if (['true', true].includes(isVideo)) {
    const key = `${uuidv4()}-video.mp4`;
    url = await getUploadingSignedURL(key, 15004);
    req.body.video = `${process.env.AWS_VIDEO_BUCKET_LINK}${key}`;
  }

  const teacher = await User.create({...req.body,role:'teacher'});
  
  res.status(200).json({
    status: 'success',
    data: {data:teacher,url},
  });
});

exports.adminUpdateTeacher = catchAsync(async (req, res, next) => {
  const {id}=req.params;
  const files=req.files;
  const {isVideo}=req.body;
  let url;

  if(files?.photo){
    req.body.photo=files?.photo[0].key;
  }

  if (['true', true].includes(isVideo)) {
    const key = `${uuidv4()}-video.mp4`;
    url = await getUploadingSignedURL(key, 15004);
    req.body.video = `${process.env.AWS_VIDEO_BUCKET_LINK}${key}`;
  }


  const updatedTeacher = await User.findByIdAndUpdate(id,req.body,{new:true});
  
  res.status(200).json({
    status: 'success',
    data: {data:updatedTeacher,url},
  });
});

exports.adminUpdateWaitingListUser = catchAsync(async (req, res, next) => {
  const {id}=req.params;

  const doc = await WaitingList.findByIdAndUpdate(id,req.body,{new:true});
  
  res.status(200).json({
    status: 'success',
    data:doc
  });
});

exports.adminUpdateVibeGuide = catchAsync(async (req, res, next) => {
  const {id}=req.params;
  const files=req.files;
  const {isVideo}=req.body;
  let url;

  if(files?.photo){
    req.body.photo=files?.photo[0].key;
  }

  if (['true', true].includes(isVideo)) {
    const key = `${uuidv4()}-video.mp4`;
    url = await getUploadingSignedURL(key, 15004);
    req.body.video = `${process.env.AWS_VIDEO_BUCKET_LINK}${key}`;
  }


  if(req.body.weeklyHours){
  req.body.weeklyHours=JSON.parse(req.body.weeklyHours)
  }

  if(req.body.dateOverride){
    // let counter=0;
  req.body.dateOverride=JSON.parse(req.body.dateOverride)
//   console.log("🚀 ~ file: userController.js:309 ~ exports.adminUpdateVibeGuide=catchAsync ~ req.body.dateOverride:", req.body.dateOverride)
//   req.body.dateOverride.forEach((data)=>{
//     data?.overrideHours.forEach((ele)=>{
//         if(!ele?.timeIn || !ele?.timeOut)
//         {
//             counter+=1;
//         }
//     })
// })
// if(counter>0)
// {
//   return next(new AppError("Override date or time missing!",400))
// }
  }

  const updatedVibeGuide = await User.findByIdAndUpdate(id,req.body,{new:true});
  
  res.status(200).json({
    status: 'success',
    data: {data:updatedVibeGuide,url},
  });
});

exports.adminCreateVibeGuide = catchAsync(async (req, res, next) => {
  const files=req.files;
  const {vibeGuideName,description,weeklyHours,thirtyMinSession,sixtyMinSession,dateOverride,isVideo}=req.body;
  let url;

  if(!vibeGuideName || !description || !weeklyHours || !thirtyMinSession || !sixtyMinSession)return next(new AppError("Missing Parameters",400));

  if(!files?.photo)return next(new AppError("Profile Photo Missing",400));

  if(files?.photo){
    req.body.photo=files?.photo[0].key;
  }

  if (['true', true].includes(isVideo)) {
    const key = `${uuidv4()}-video.mp4`;
    url = await getUploadingSignedURL(key, 15004);
    req.body.video = `${process.env.AWS_VIDEO_BUCKET_LINK}${key}`;
  }

  req.body.weeklyHours=JSON.parse(weeklyHours)

  if(dateOverride){
  // let counter=0
  req.body.dateOverride=JSON.parse(dateOverride)
//   req.body.dateOverride.forEach((data)=>{
//     data?.overrideHours.forEach((ele)=>{
//         if(!ele?.timeIn || !ele?.timeOut)
//         {
//           counter+=1
//         }
//     })
// })

//   if(counter>0)
//   {
//     return next(new AppError("Override date or time missing!",400))
//   }
  }

  const vibeGuide = await User.create({...req.body,role:'vibe-guide'});
  
  res.status(200).json({
    status: 'success',
    data: {data:vibeGuide,url},
  });
});

exports.adminDeleteTeacher = catchAsync(async (req, res, next) => {
  const {id}=req.params;

  const teacher = await User.findByIdAndDelete(id);

  if(!teacher)return next(new AppError("Teacher Not Found",400));
  
  res.status(200).json({
    status:"success",
    message: 'Teacher Deleted Successfully',
    data: teacher,
  });
});

exports.adminDeleteVibeGuide = catchAsync(async (req, res, next) => {
  const {id}=req.params;

  const vibeGuide = await User.findByIdAndDelete(id);

  if(!vibeGuide)return next(new AppError("Vibe Guide Not Found",400));
  
  res.status(200).json({
    status:"success",
    message: 'Vibe Guide Deleted Successfully',
    data: vibeGuide,
  });
});


exports.joinWaitingList = catchAsync(async (req, res, next) => {
  const {user}=req;

  const waitingListUser = await WaitingList.create({user:user?._id})

  res.status(200).json({
    status: 'success',
    data:waitingListUser
  });
});

exports.getWaitingListUsers = catchAsync(async (req, res, next) => {
  const {search}=req.query;
  
  const waitingListUsers = await WaitingList.aggregate([
    {
      '$match': {
        'status': 'pending'
      }
    }, {
      '$lookup': {
        'from': 'users', 
        'localField': 'user', 
        'foreignField': '_id', 
        'as': 'user'
      }
    }, {
      '$unwind': {
        'path': '$user'
      }
    }, 
    {
      '$match': {
        'user.email': {
          '$regex':search?search:"", 
          '$options': 'i'
        }
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    data:waitingListUsers
  });
});