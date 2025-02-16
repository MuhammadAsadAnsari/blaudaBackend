const mongoose = require('mongoose');
const ContactUsSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    message:{
      type:String,
    },
  },
  { timestamps: true }
);

const ContactUs = mongoose.model('ContactUs', ContactUsSchema);

module.exports = ContactUs;
