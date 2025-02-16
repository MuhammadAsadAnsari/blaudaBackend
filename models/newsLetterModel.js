const mongoose = require('mongoose');
const validator = require('validator');
const NewsLetterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      index: true,
    },
  },
  { timestamps: true }
);

const NewsLetter = mongoose.model('NewsLetter', NewsLetterSchema);

module.exports = NewsLetter;
