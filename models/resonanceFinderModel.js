const mongoose = require('mongoose');
const ResonanceFinderSchema = new mongoose.Schema(
  {
    thumbnail: {
      type: String,
    },
    direction: {
      type: String,
    },
    key: {
      type: String,
    },
    video: {
      type: String,
    },
  },
  { timestamps: true }
);

const ResonanceFinder = mongoose.model('ResonanceFinder', ResonanceFinderSchema);

module.exports = ResonanceFinder;
