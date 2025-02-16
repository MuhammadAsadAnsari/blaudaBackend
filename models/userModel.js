const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    photo: {
      type: String,
    },
    video: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    teacherName:{
      type:String
    },
    vibeGuideName:{
      type:String
    },
    description: {
      type: String,
    },
    weeklyHours: {
      type: Object,
    },
    dateOverride: {
      type: Array,
    },
    thirtyMinSession: {
      type: Number,
    },
    sixtyMinSession: {
      type:Number,
    },
    link: {
      type: String,
    },
    role: {
      type: String,
      enum: ['admin','user','teacher','vibe-guide'],
      default: 'user',
    },
    email: {
      type: String,
      // unique: true,
      // required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      index: true,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    userType: {
      type: String,
      enum:["web","app"],
      default:"web"
    },
    postalCode: {
      type: String,
    },
    verificationCode: {
      type: String,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,ref:'Package',
    },
    avatar: {
      type:mongoose.Schema.Types.ObjectId,ref:'Bloom',
      default:'64bf85fc9d26b04a4ba4dfa1'
    },
    bloom: {
      type:mongoose.Schema.Types.ObjectId,ref:'Bloom',
      default:'649c10323bfa926d8ec50652'
    },
    bloomUpdatedDate: {
      type: Date,
    },
    bloomPercentage: {
      type: Number,
      min: 1,
      max: 100,
      default:35
    }, 
    isActive: {
      type: Boolean,
      default: true,
    },
    isPaymentDone: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPaymentExpire: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      // required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!',
      },
    },
    passwordResetCode: {
      type: Number,
      default: 0,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    isOnline: {
      type: Boolean,
      default: false,
    },
    cus: {
      type: String,
      // required: [true, 'stripe customer id is required.'],
    },
    contactNo: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    lastLogin: {
      type: Date,
      default: Date.now(),
    },
    packageStartDate: {
      type: Date
    },
    packageEndDate: {
      type: Date
    },
    lastLogin: {
      type: Date,
      default: Date.now(),
    },
    resonanceResult: {
      selectedTagIds:[{type:mongoose.Schema.Types.ObjectId,ref:"Tag"}],
      unSelectedTagIds:[{type:mongoose.Schema.Types.ObjectId,ref:"Tag"}],
      averageScore:Number
    },
    viewsCount: {
      type:Number,
      default:0
    },
    resonanceResultDate: {
      type:Date
    },
    recentContent:{
      type:[{type:mongoose.Schema.Types.ObjectId,ref:"Video"}]
    },
    favourites:{
      type:[{type:mongoose.Schema.Types.ObjectId,ref:"Video"}]
    },
    toolsToTry:{
      type:[{type:mongoose.Schema.Types.ObjectId,ref:"Video"}]
    },
    topTools:{
      type:[{type:mongoose.Schema.Types.ObjectId,ref:"Video"}]
    },

  },
  {
    timestamps: true,
  }
);

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
