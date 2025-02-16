const mongoose = require('mongoose');

const privacyPolicySchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const PrivacyPolicy = mongoose.model('PrivacyPolicy', privacyPolicySchema);

module.exports = PrivacyPolicy;
