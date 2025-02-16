const mongoose = require('mongoose');
// const validator = require('validator');

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification creator id is required.'],
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'receiver is required.'],
    },
    message: { type: String, required: [true, 'message is required.'] }, // any description of the notification message
    // title: { type: String, required: [true, 'title is required.'] }, // any title description of the notification message
    link: String,
    seen: {
      type: Boolean,
      default: false,
    },
    for: {
      type: String,
      enum: ['user'],
      default: 'user',
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

/*
    __________FACEBOOK__________
{
    status: 'connected',
    authResponse: {
        accessToken: '{access-token}',
        expiresIn:'{unix-timestamp}',
        reauthorize_required_in:'{seconds-until-token-expires}',
        signedRequest:'{signed-parameter}',
        userID:'{user-id}'
  }
}

*/
