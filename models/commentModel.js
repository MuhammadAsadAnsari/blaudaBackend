const mongoose = require('mongoose');
const CommentSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ["pending", "approved", "trash","unapproved"],
            default: "pending"
        },
        commentType: {
            type: String,
            enum: ["website", "mobile"]
        },
        user: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User',
        },
        rating: {
            type: Number,
            default: 0,
            min: [0, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: (val) => Math.round(val * 10) / 10,
        },
        video: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Video',
        },
        comment: {
            type: String
        }
    },
    { timestamps: true }
);

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;
