const mongoose = require("mongoose");

const BloomSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      required: true,
      // enum: ["blue-lotus", "divine-ross", "mushrooms", "chuchuhuas","wolf-woman","bear-man","jaguar-being","bird-women","dolphin-being"],
    },
    type:{
      type:String,
      enum:['bloom','character'],
    },
    image: {
      type: String,
      default:'blue-lotus.png',
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Bloom = mongoose.model("Bloom", BloomSchema);
module.exports = Bloom;
