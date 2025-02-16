const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema(
  {
    icon: {
      type: String,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    categoryType:{
      type:String,
      enum:['tools','groundwork']
    },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
