const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: true
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const Bloom = mongoose.model("Tag", TagSchema);
module.exports = Bloom;
