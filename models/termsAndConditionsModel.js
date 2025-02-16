const mongoose = require('mongoose');

const TermAndConditionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const TermAndCondition = mongoose.model(
  'TermAndCondition',
  TermAndConditionSchema
);

module.exports = TermAndCondition;
