const mongoose = require('mongoose');
const ResonanceFinderQuestionSchema = new mongoose.Schema(
  {
    statement: {
      type: String,
      required: true,
    },
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
    answer1: {
      type: String,
      required: true,
    },
    answer1Value: {
      type: Number,
      required: true,
    },
    answer2: {
      type: String,
      required: true,
    },
    answer2Value: {
      type: Number,
      required: true,
    },
    answer3: {
      type: String,
      required: true,
    },
    answer3Value: {
      type: Number,
      required: true,
    },
    answer4: {
      type: String,
      required: true,
    },
    answer4Value: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const ResonanceFinderQuestion = mongoose.model('ResonanceFinderQuestion', ResonanceFinderQuestionSchema);

module.exports = ResonanceFinderQuestion;
