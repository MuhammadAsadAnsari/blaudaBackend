const Cms = require('../models/cmsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Crud = require('../models/crudModel');

exports.updatePage = catchAsync(async (req, res, next) => {
  let { _id, pageName } = req.body;
  const { files } = req;

  console.log();

  if (!_id || !pageName) return next(new AppError('args are missing.', 400));

  let outter = {
    [pageName]: { ...req.body },
  };

  req.body[pageName] = outter[pageName];

  //home
  if (files?.coverImage)
    req.body[pageName].coverImage = files.coverImage[0].key;

  if (files?.section1CoverPhoto)
    req.body[pageName].section1CoverPhoto = files.section1CoverPhoto[0].key;

  if (files?.section1Image)
    req.body[pageName].section1Image = files.section1Image[0].key;
  if (files?.section2Image)
    req.body[pageName].section2Image = files.section2Image[0].key;
  if (files?.heroSectionImage)
    req.body[pageName].heroSectionImage = files.heroSectionImage[0].key;

  //market_palce
  if (files?.cover_image)
    req.body[pageName].cover_image = files.cover_image[0].key;

  let doc = await Cms.findByIdAndUpdate(_id, req.body, { new: true });

  res.status(200).json({
    status: 'success',
    data: doc,
  });
});

exports.getDynamicPage = catchAsync(async (req, res, next) => {
  let { pages, all } = req.query;

  if (all == 'true') {
    const d = await Cms.find({});

    const pagesDynamicArray = [
      'home',
      'groundWork'
    ];
    let newArray = [];
    d.map((item, i) => {
      pagesDynamicArray.map((pg) => {
        if (item[pg]) {
          item[pg]._id = item?._id;
          newArray.push(item[pg]);
        }
      });
    });

    res.status(200).json({
      status: 'success',
      results: newArray.length,
      pages: newArray,
    });
  } else {
    let doc = {};

    const d = await Cms.findOne({ [pages]: { $exists: true } }).lean();
    doc = d[pages];

    if (pages == 'home') {
      const howItWorks = await Crud.find({sectionName:'how-it-works'});
      doc.howItWorks = howItWorks;
    }

    res.status(200).json({
      status: 'success',
      data: {
        pages: doc,
      },
    });
  }
});
