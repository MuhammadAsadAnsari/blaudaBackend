const mongoose = require('mongoose');

const crudSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      enum: [
        'essentials',
        'building-slocks',
        'deeper-cuts',
        'play',
        'tools-for-connecting-our-life',
        'tools-for-worker-and-shadow',
        'tools-for-connection',
        'featured-tool-for-connection',
        'how-it-works'
      ],
    },
    title: String,
    description: String,
    image: String,
    video: String,
  },
  { timestamps: true }
);
const Crud = mongoose.model('Crud', crudSchema);

module.exports = Crud;
