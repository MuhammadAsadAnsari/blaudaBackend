import { Request } from 'express';

import AppError from './appError';


const S3 = require('aws-sdk/clients/s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const imageBucket = process.env.AWS_IMAGE_BUCKET_NAMES;
const pdfBucket = process.env.AWS_IMAGE_BUCKET_NAMES;
const region = process.env.AWS_BUCKET_REGIONS;
const accessKeyId = process.env.AWS_ACCESS_KEYS;
const secretAccessKey = process.env.AWS_SECRET_KEYS;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const multerPdfFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: (error: any, metadata?: any) => void
) => {
  console.log('🚀 ~ file: s3.js:23 ~ multerPdfFilter ~ file:', file);
  if (
    file.mimetype.startsWith('image') ||
    file.mimetype.startsWith('application/pdf') ||
    file.mimetype.startsWith('video/mp4') ||
    file.mimetype.startsWith('video/quicktime') ||
    file.mimetype.startsWith('audio/mpeg') ||
    file.mimetype.startsWith('image/svg+xml') ||
    file.mimetype.startsWith('image/jpg') ||
    file.mimetype.startsWith('image/jpeg') ||
    file.mimetype.startsWith('image/png')
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid mimetype.', 400), false);
  }
};

const uploadPDfs = multer({
  storage: multerS3({
    s3: s3,
    bucket: pdfBucket,
    metadata: function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: any, metadata?: any) => void
    ) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: any, metadata?: any) => void
    ) {
      cb(null, `${uuidv4()}-pdf`);
    },
  }),
  limits: { fileSize: 3000000 }, // In bytes: 3000000 bytes = 3 MB
  fileFilter: multerPdfFilter,
});

exports.uploadUserPDfs = uploadPDfs.fields([
  {
    name: 'documents',
    maxCount: 4,
  },
  {
    name: 'pdf',
    maxCount: 1,
  },
]);

const uploadImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: imageBucket,
    metadata: function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: any, metadata?: any) => void
    ) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: any, metadata?: any) => void
    ) {
      console.log('🚀 ~ file: s3.js:77 ~ file:', file);
      let type;
      if (file?.mimetype == 'image/jpg') type = 'jpg';
      else if (file?.mimetype == 'image/jpeg') type = 'jpeg';
      else if (file?.mimetype == 'image/png') type = 'png';
      console.log(type);
      cb(null, `${uuidv4()}.${type}`);
    },
  }),
  limits: { fileSize: 3000000 }, // In bytes: 2000000 bytes = 3 MB
  fileFilter: multerPdfFilter,
  
}

);

export const uploadUserImage = uploadImage.fields([
  {
    name: 'photos',
  },
  {
    name: 'photo',
  },
]);

export const getUploadingSignedURL = async (Key:string, Expires = 15004) => {
  try {
    const url = await s3.getSignedUrlPromise('putObject', {
      Bucket: imageBucket,
      Key: Key,
      Expires,
    });
    return url;
  } catch (error) {
    return error;
  }
};

function getFileStream(fileKey:string) {
  const downloadParams = {
    Key: fileKey,
    Bucket: imageBucket,
  };

  return s3.getObject(downloadParams).createReadStream();
}
exports.getFileStream = getFileStream;

export const deleteImage = (fileKey:string) => {
  if (['default.png'].includes(fileKey)) return;

  const deleteParams = {
    Key: fileKey,
    Bucket: imageBucket,
  };

  return s3.deleteObject(deleteParams).promise();
};







