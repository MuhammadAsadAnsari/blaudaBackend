const mongoose = require("mongoose");
const getVideoDuration = require("../utils/videoDuration");

const VideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      // minLength: [5, "Title must be atleast 5 characters"],
      // unique: true,
    },
    videoFor: {
      type: String,
      enum: ['web', 'app'],
    },
    videoType: {
      type: String,
      enum: ['tool', 'groundwork', 'bloom'],
      required: [true, "Video type is required"]
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    comments: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
      default: []
    },
    averageRating:{
      type: Number,
            default: 0,
            min: [0, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: (val) => Math.round(val * 10) / 10,
    },
    description: {
      type: String,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    video: {
      type: String,
    },
    videoDuration: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tag",
        },
      ]
    },
    relatedContent: {
      type: [{type:mongoose.Schema.Types.ObjectId,ref:"Video"}]
    },
    recommendedContent: {
      type: [{type:mongoose.Schema.Types.ObjectId,ref:"Video"}]
    },
    additionalResources: {
      title: String, 
      description: String, 
      link: String
    },
    teachers: {
      type:[{
      teacherId:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
      notes:String,
      url:String,
      displayUrl:String
      }]
    },
    views: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    postedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", VideoSchema);

module.exports = Video;
