// const admin = require('firebase-admin');
const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.createNotification = async (pushNotificationObject, obj) => {
  let imageUrl = '';

  if (pushNotificationObject?.fcmToken?.length > 0) {
    imageUrl = `${process.env.BACKEND_URL}/img/logo.png`;

    admin
      .messaging()
      .sendMulticast({
        notification: {
          title: pushNotificationObject?.title,
          body: obj.message,
          imageUrl,
          // 'https://i.pinimg.com/736x/f0/42/ad/f042ada5fe30d167bc6a9b0c0fc0a60e.jpg',
        },
        tokens: pushNotificationObject?.fcmToken,
      })
      .then((response) => console.log('notification sent!'));
  }

  let notf = await Notification.create(obj);

  notf.receiver = notf.receiver._id;

  if (obj?.socket) {
    io.getIO().emit('new-notification', notf);
  }
};

exports.createManyNotification = async (req, ArrayObjs) => {
  // req.body.read_by = req?.user?._id;
  await Notification.insertMany(ArrayObjs);
};

exports.seenNotifiation = catchAsync(async (req, res, next) => {
  //   code here
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 15;
  const skip = (page - 1) * limit;
  let notificationId = req.query.notificationId;

  let notfs;
  // this will always be zero because after seen there will not any new notification left
  let newNotifications = 0;

  // seen notification
  // await Notification.updateMany(
  //   {
  //     seen: false,
  //     receiver: req.user._id,
  //   },
  //   { seen: true },
  //   { new: true }
  // )
  //   .sort({ createdAt: -1 })
  //   .skip(skip)
  //   .limit(limit);

  let unreadNotifications = await Notification.countDocuments({
    receiver: req.user._id,
    seen: false,
    // createdAt: { $gte: req.user.lastLogin },
  });

  let doSeen = await Notification.findByIdAndUpdate(
    notificationId,
    { seen: true },
    { new: true }
  );

  // getting notification
  notfs = await Notification.find({
    receiver: req.user._id,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: 'success',
    results: notfs.length,
    newNotifications,
    unreadNotifications,
    data: notfs,
  });
});

exports.getAllNotificationsForAll = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 15;
  const skip = (page - 1) * limit;

  // checking for new notifications
  const newNotifications = await Notification.countDocuments({
    receiver: req.user._id,
    seen: false,
    createdAt: { $gte: req.user.lastLogin },
  });

  // sending notification
  const notfs = await Notification.find({
    receiver: req.user._id,
  })
    .populate(
      'sender',
      'firstName lastName companyName photo coverPhoto isOnline'
    )
    .populate('job')
    // .populate('payload.roomId')
    // .populate('payload.eventId')
    // .populate('receiver')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // SEEN all notifications
  // await Notification.updateMany(
  //   {
  //     seen: false,
  //     receiver: req.user._id,
  //     createdAt: { $gte: req.user.lastLogin },
  //   },
  //   { seen: true },
  //   { new: true }
  // );

  res.status(200).json({
    status: 'success',
    results: notfs.length,
    newNotifications,
    data: notfs,
  });
});

exports.deleteNotification = factory.deleteOne(Notification);
exports.updateNotification = factory.updateOne(Notification);

exports.getAllNotificationsForAdmin = catchAsync(async (req, res, next) => {
  const { user } = req;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;
  const noPagination = req.query.noPagination || false;

  if (noPagination) {
    doc = await Notification.find({ for: 'admin' })
      .populate('sender', 'firstName')
      .populate('job', 'jobTitle');
  } else {
    doc = await Notification.find({ for: 'admin' })
      .populate('sender', 'firstName')
      .populate('job', 'jobTitle')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  // sendind the final response
  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc,
  });
});
