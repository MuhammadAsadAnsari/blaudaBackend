const S3 = require('aws-sdk/clients/s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const AppError = require('./appError');
const fs = require('fs');
const path = require('path');

const imageBucket = process.env.AWS_IMAGE_BUCKET_NAME;
const pdfBucket = process.env.AWS_IMAGE_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const multerPdfFilter = (req, file, cb) => {
  console.log("🚀 ~ file: s3.js:23 ~ multerPdfFilter ~ file:", file)
  if (
    file.mimetype.startsWith('image') ||
    file.mimetype.startsWith('application/pdf') ||
    file.mimetype.startsWith('video/mp4')||
    file.mimetype.startsWith('video/quicktime')||
    file.mimetype.startsWith('audio/mpeg')||
    file.mimetype.startsWith('image/svg+xml')||
    file.mimetype.startsWith('image/jpg')||
    file.mimetype.startsWith('image/jpeg') ||
    file.mimetype.startsWith('image/png')
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError('Invalid mimetype.', 400),
      false
    );
  }
};

const uploadPDfs = multer({
  storage: multerS3({
    s3: s3,
    bucket: pdfBucket,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
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
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      console.log("🚀 ~ file: s3.js:77 ~ file:", file)
      let type;
      if (file?.mimetype == 'application/pdf') type = 'pdf';
      else if (file?.mimetype == 'video/mp4') type = 'mp4';
      else if (file?.mimetype == 'video/quicktime') type = 'mov';
      else if (file?.mimetype == 'audio/mpeg') type = 'mp3';
      else if (file?.mimetype == 'image/svg+xml') type = 'svg';
      else if (file?.mimetype == 'image/jpg') type = 'jpg';
      else if (file?.mimetype == 'image/jpeg') type = 'jpeg';
      else if (file?.mimetype == 'image/png') type = 'png';
      console.log(type)
      cb(null, `${uuidv4()}.${type}`);
    },
  }),
  // limits: { fileSize: 3000000 }, // In bytes: 2000000 bytes = 3 MB
  fileFilter: multerPdfFilter,
});

exports.uploadUserImage = uploadImage.fields([
  {
    name: 'photo',
    maxCount: 1,
  },
  {
    name: 'audio',
    maxCount: 1,
  },
  {
    name: 'thumbnail',
    maxCount: 1,
  },
  {
    name: 'video',
    maxCount: 1,
  },
  {
    name: 'logo',
    maxCount: 1,
  },
  {
    name: 'icon',
    maxCount: 1,
  },
  {
    name: 'avatar',
    maxCount: 1,
  },
  {
    name: 'heroSectionImage',
    maxCount: 1,
  },
  {
    name: 'documents',
    maxCount: 4,
  },
  {
    name: 'pdf',
    maxCount: 5,
  },
  {
    name: 'cover_image',
    maxCount: 1,
  },
  {
    name: 'image',
    maxCount: 1,
  },
  {
    name: 'icon',
    maxCount: 1,
  },
  {
    name: 'compensationtype_image',
    maxCount: 1,
  },
  {
    name: 'cms',
    maxCount: 10,
  },
  {
    name: 'coverImage',
    maxCount: 1,
  },
  {
    name: 'section1CoverPhoto',
    maxCount: 1,
  },
  {
    name: 'section1Image',
    maxCount: 1,
  },
  {
    name: 'section2Image',
    maxCount: 1,
  },
  {
    name: 'section4CoverPhoto',
    maxCount: 1,
  },
  {
    name: 'sec2Image',
    maxCount: 1,
  },
  {
    name: 'sec3Image',
    maxCount: 1,
  },
  {
    name: 'sec4Image',
    maxCount: 1,
  },
]);

exports.getUploadingSignedURL = async (Key, Expires = 15004) => {
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

function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: imageBucket,
  };

  return s3.getObject(downloadParams).createReadStream();
}
exports.getFileStream = getFileStream;

exports.deleteImage = (fileKey) => {
  if (['default.png'].includes(fileKey)) return;

  const deleteParams = {
    Key: fileKey,
    Bucket: imageBucket,
  };

  return s3.deleteObject(deleteParams).promise();
};

exports.deleteVideo = (fileKey) => {

  const deleteParams = {
    Key: fileKey,
    Bucket: imageBucket,
  };

  return s3.deleteObject(deleteParams).promise();
};

exports.deletePDF = (fileKey) => {
  const deleteParams = {
    Key: fileKey,
    Bucket: pdfBucket,
  };

  return s3.deleteObject(deleteParams).promise();
};

exports.deleteExcelSheet = (fileKey) => {
  const deleteParams = {
    Key: fileKey,
    Bucket: pdfBucket,
  };

  return s3.deleteObject(deleteParams).promise();
};

exports.uploadServerFile = (filePath, isUploadExcelSheet) => {
  const fileContent = fs.createReadStream(filePath);

  const params = {
    Bucket: imageBucket,
    Key: path.basename(filePath),
    Body: fileContent,
    ...(isUploadExcelSheet && { ContentType: 'application/xlsx' }),
  };

  return s3.upload(params).promise();
};

function getPDFFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: pdfBucket,
  };

  return s3.getObject(downloadParams).createReadStream();
}



exports.getPDFFileStream = getPDFFileStream;
