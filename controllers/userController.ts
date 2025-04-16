import multer from 'multer';
import moment from 'moment';
import { NextFunction, Request, Response } from 'express';
// const User = require('../models/userModel');
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import { deleteImage, getUploadingSignedURL } from '../utils/s3';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from '../interfaces/userInterface';
import { S3File } from '../interfaces/s3Interface';
import { Repository } from 'typeorm';
import { User } from '../models/userEntity';
import { AppDataSource } from '../server';

export const getUserRepo = (): Repository<User> => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database is not initialized yet!');
  }
  return AppDataSource.getRepository(User);
};
export const getMe = (req: IUser , res: Response, next: NextFunction) => {

  if(!req.user) return next(new AppError('Not authorized to perform this action', 401)); 
  req.params.id = String(req.user.id);
  next();
};

export const updateMe = catchAsync(
  async (req: IUser, res: Response, next: NextFunction) => {
    // 1) Create error if user POSTs password data
    const files = req.files as { [fieldname: string]: S3File[] };

    let user = req.user;
    console.log(
      '🚀 ~ file: userController.js:26 ~ exports.updateMe=catchAsync ~ req:',
      req.body
    );

    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400
        )
      );
    }
    if (files?.photo && files.photo.length > 0) {
      req.body.photo = files.photo[0].key;
    }
    const userRepo: Repository<User> = getUserRepo();

    await userRepo.update(Number(user?.id), req.body);

    const updatedUser = await userRepo.findOne({
      where: { id: Number(user?.id) },
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  }
);





