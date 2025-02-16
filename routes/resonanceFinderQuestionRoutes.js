const express = require('express');
const resonanceFinderQuestionController = require('../controllers/resonanceFinderQuestionController');
const { uploadUserImage } = require('../utils/s3');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .post(resonanceFinderQuestionController.createResonanceFinderQuestion);

router
  .route('/:id')
  .patch(resonanceFinderQuestionController.updateResonanceFinderQuestion);

router
  .route('/:id')
  .delete(resonanceFinderQuestionController.deleteResonanceFinderQuestion);

router
  .route('/:id')
  .get(resonanceFinderQuestionController.getResonanceFinderQuestion);

router
  .route('/all/questions')
  .get(resonanceFinderQuestionController.getAllResonanceFinderQuestions
);
router
  .route('/all/questions/mobile')
  .post(resonanceFinderQuestionController.getAllResonanceFinderQuestionsForMobile
);
router
  .route('/all/questions/web')
  .post(resonanceFinderQuestionController.getAllResonanceFinderQuestionsForWeb
);

router
  .route('/results')
  .get(resonanceFinderQuestionController.resonanceFinderResult
);

module.exports = router;
