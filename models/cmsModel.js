const mongoose = require('mongoose');

const cmsSchema = new mongoose.Schema(
  {
    home: {
      type: {
        pageName: { type: String, default: 'home' },
        section1Heading: String,
        section1SubHeading: String,
        section1Image: String,

        section2Heading: String,
        section2Description: String,
        section2Video: String,

        section3Heading: String,
        section3Description: String,
        section3Video: String,
        
        section5Heading1: String,
        section5Description1: [String],

        section5Heading2: String,
        section5Description2: [String],

        section5Heading3: String,
        section5Description3: [String],

        section5Heading4: String,
        section5Description4: [String],

        section7Heading1: String,
        section7Description1: String,
        section7Video1: String,

        section7Heading2: String,
        section7Description2: String,
        section7Video2: String,

        section7Heading2: String,
        section7Description2: String,
        section7Video2: String,

      },
    },
    groundWork: {
      type: {
        // main
        pageName: { type: String, default: 'about_us' },
        heading: String,
        cover_image: String,

        // sec 1
        sec1Heading: String,
        sec1Image: String,
        sec1Description: String,

        sec2Heading: String,
        sec2Description: String,

        sec3Heading: String,
        sec3Image: String,
        sec3Description: String,
      },
    },
  },
  { timestamps: true }
);
const Cms = mongoose.model('Cms', cmsSchema);

module.exports = Cms;
