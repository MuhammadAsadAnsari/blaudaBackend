const BloomOrCharacter = require('../models/bloomOrCharacterModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllBloomsOrCharacters = catchAsync(async (req, res, next) => {
  const {type}=req.query;
  const data = await BloomOrCharacter.find({isActive:true,type});
  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getAllBloomsOrCharactersForAdmin = catchAsync(async (req, res, next) => {
  const {type,search}=req.query;
  let query={isActive:true,type};

  if(type=='all')
  {
    query={
      isActive:true,
      type:{$in:['bloom','character']}
    }
  }

  if (search && search != '')
  query = {
    ...query,
    $or: [
      { title: { $regex: search, $options: 'i' } },
    ],
  };

  const data = await BloomOrCharacter.find(query);

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.createBloomOrCharacter = catchAsync(async (req, res, next) => {
const files=req.files;

  if(files?.image){
    req.body.image=files?.image[0].key;
  }

  const doc = await BloomOrCharacter.create(req.body);

  res.status(201).json({
    status: 'success',
    data:doc,
  });
});

exports.updateBloomOrCharacter = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const files=req.files;

  if (!id) return next(new AppError('Bloom Not Found.', 401));

  if(files?.image){
    req.body.image=files?.image[0].key;
  }

  const updatedBloomOrCharacter = await BloomOrCharacter.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedBloomOrCharacter,
  });
});

exports.deleteBloomOrCharacter = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if(id=="64bf85fc9d26b04a4ba4dfa1")
  {
    return next(new AppError("Cannot delete default Avatar",400))
  }
  else if(id=="649c10323bfa926d8ec50652")
  {
    return next(new AppError("Cannot delete default Bloom",400))
  }

  const deletedBloomOrCharacter = await BloomOrCharacter.findByIdAndUpdate(id,{isActive:false}, {
    new: true,
  });

  res.status(200).json({
    status: 'success',
    data: deletedBloomOrCharacter,
  });
});

