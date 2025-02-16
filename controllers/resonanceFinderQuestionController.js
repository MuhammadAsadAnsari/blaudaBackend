const ResonanceFinderQuestion = require('../models/resonanceFinderQuestionModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Tag = require('../models/tagModel');
const ResonanceFinder = require('../models/resonanceFinderModel');

exports.createResonanceFinderQuestion = catchAsync(async (req, res, next) => {
    const { statement, tag, answer1, answer1Value, answer2, answer2Value, answer3, answer3Value, answer4, answer4Value, } = req.body;

    if (!statement || !answer1 || !answer1Value || !answer2 || !answer2Value || !answer3 || !answer3Value || !answer4 || !answer4Value) return next(new AppError("Please provide required info", 400));

    // const checkTag = await Tag.findById(tag);
    // if (!checkTag)
    //     return next(new AppError("Please provide a valid tag", 400));

    const doc = await ResonanceFinderQuestion.create(req.body);

    res.status(201).json({
        status: 'success',
        data: doc,
    });
});

exports.updateResonanceFinderQuestion = catchAsync(async (req, res, next) => {

    const { id } = req.params;

    let { tag } = req.body;

    if (tag) {
        const checkTag = await Tag.findById(tag);
        if (!checkTag) return next(new AppError("Please provide correct tag", 400))
    }

    const updatedResonanceFinderQuestion = await ResonanceFinderQuestion.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedResonanceFinderQuestion) return next(new AppError("Failed to update resonance finder question. PLease check if id id correct", 400))

    res.status(200).json({
        status: 'success',
        data: updatedResonanceFinderQuestion,
    });
});

exports.deleteResonanceFinderQuestion = catchAsync(async (req, res, next) => {

    const { id } = req.params;

    const deletedResonanceFinderQuestion = await ResonanceFinderQuestion.findByIdAndDelete(id);

    if (!deletedResonanceFinderQuestion)
        return next(new AppError("Failed to delete resonance finder question. PLease check if id id correct", 400));

    res.status(200).json({
        status: 'success',
        data: deletedResonanceFinderQuestion,
    });
});

exports.getResonanceFinderQuestion = catchAsync(async (req, res, next) => {

    const { id } = req.params;

    const resonanceFinderQuestion = await ResonanceFinderQuestion.findById(id);

    if (!resonanceFinderQuestion)
        return next(new AppError("No question found with id '" + id + "'", 400));

    res.status(200).json({
        status: 'success',
        data: resonanceFinderQuestion,
    });
});

exports.getAllResonanceFinderQuestions = catchAsync(async (req, res, next) => {

    const resonanceFinderQuestions = await ResonanceFinderQuestion.find().populate(
        "tag",
        "name"
      );
      if (!resonanceFinderQuestions)
        return next(new AppError("Failed to find resonance finder questions",400));

    const resonanceFinder=await ResonanceFinder.findOne({key:"resonance-finder"})

    res.status(200).json({
        status: 'success',
        results:resonanceFinderQuestions.length,
        data: {questions:resonanceFinderQuestions,resonanceFinder},
    });
});

exports.getAllResonanceFinderQuestionsForMobile = catchAsync(async (req, res, next) => {

    const {tagIds}=req.body;
    const resonanceFinderQuestions = await ResonanceFinderQuestion.find({tag:{$in:tagIds}}).populate(
        "tag",
        "name"
      );
      if (!resonanceFinderQuestions)
        return next(new AppError("Failed to find resonance finder questions",400));

    const resonanceFinder=await ResonanceFinder.findOne({key:"resonance-finder"})

    res.status(200).json({
        status: 'success',
        results:resonanceFinderQuestions.length,
        data: {questions:resonanceFinderQuestions,resonanceFinder},
    });
});

exports.getAllResonanceFinderQuestionsForWeb = catchAsync(async (req, res, next) => {

    const {tagIds}=req.body;
    const resonanceFinderQuestions = await ResonanceFinderQuestion.find({tag:{$in:tagIds}}).populate(
        "tag",
        "name"
      );
      if (!resonanceFinderQuestions)
        return next(new AppError("Failed to find resonance finder questions",400));

    const resonanceFinder=await ResonanceFinder.findOne({key:"resonance-finder"})

    res.status(200).json({
        status: 'success',
        results:resonanceFinderQuestions.length,
        data: {questions:resonanceFinderQuestions,resonanceFinder},
    });
});

exports.resonanceFinderResult = catchAsync(async (req, res, next) => {

    const sortByNameResults = req?.body?.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
  
      let combinedResults = {};
      sortByNameResults.map((rslt, i, array) => {
        if (combinedResults[rslt?.id]) {
          combinedResults[rslt?.id] = {
            ...rslt,
            value: array[i - 1] ? rslt?.value + array[i - 1]?.value : rslt?.value,
          };
        } else {
          combinedResults[rslt?.id] = { ...rslt };
        }
      });
      combinedResults = Object.values(combinedResults);
      let finalResults = combinedResults.sort((a, b) => {
        if (a.value < b.value) return 1;
        if (a.value > b.value) return -1;
        return 0;
      });

    res.status(200).json({
        status: 'success',
        data: finalResults,
    });
});

