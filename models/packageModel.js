const mongoose = require('mongoose');
const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Package name is required.'],
    },
    price: {
      type: Number,
      default:0
    },
    priceId:{
      type:String,
    },
    prodId:{
      type:String,
    },
    isRecurring:{
      type:Boolean,
    },
    description: {
      type: String,
    },
    duration: {
      type: String,
    },
  },
  { timestamps: true }
);

const Package = mongoose.model('Package', PackageSchema);

module.exports = Package;
