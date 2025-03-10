import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { IListing } from '../interfaces/listingInterface';
import { ILike, Repository } from 'typeorm';
import { Listing } from '../models/listngEntity';
import { AppDataSource } from '../server';
import { S3File } from '../interfaces/s3Interface';
import AppError from '../utils/appError';
import {deleteImage} from "../utils/s3"

const getListingRepo = (): Repository<Listing> => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database is not initialized yet!');
  }
  return AppDataSource.getRepository(Listing);
};

export const addListing = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      location,
      city,
      offerNo,
      chassisNo,
      carStatus,
      make,
      model,
      grade,
      modelYear,
      manufactured,
      firstRegistrationDate,
      engineSize,
      milleage,
      seats,
      driveType,
      bodyType,
      steering,
      transmission,
      color,
      price,
      fuelType,
      name,
      From,
    } = JSON.parse(req.body.data);
    const files = req.files as { [fieldname: string]: S3File[] };

    if (!files?.photos)
      return next(new AppError('minium one photo is required', 400));

    if (
      !location ||
      !city ||
      !offerNo ||
      !chassisNo ||
      !carStatus ||
      !make ||
      !model ||
      !grade ||
      !modelYear ||
      !manufactured ||
      !firstRegistrationDate ||
      !engineSize ||
      !milleage ||
      !seats ||
      !driveType ||
      !bodyType ||
      !steering ||
      !transmission ||
      !color ||
      !price ||
      !fuelType ||
      !name ||
      !From
    )
      return next(new AppError('All fields are required', 400));
    const listingRepo: Repository<Listing> = getListingRepo();

    //found listing

    const listingExist = await listingRepo.findOne({ where: { chassisNo } });

    if (listingExist) {
      return next(new AppError('Chassis number already exists', 400));
    }
    console.log('abcd');
    const photos = files.photos.map((photo) => photo.key);

    const newListing = listingRepo.create({
      location,
      city,
      offerNo,
      chassisNo,
      carStatus,
      make,
      model,
      grade,
      modelYear,
      manufactured,
      firstRegistrationDate,
      engineSize,
      milleage,
      seats,
      driveType,
      bodyType,
      steering,
      transmission,
      color,
      price,
      fuelType,
      name,
      status: 'Active',
      photos,
      From,
    });

    await listingRepo.save(newListing);

    newListing.slug = `AtoB-${newListing.id}`;
    await listingRepo.save(newListing);

    console.log('new listing', newListing);
    return res.status(201).json({ success: true, data: newListing });
  }
);

export const getAllListings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const listingRepo: Repository<Listing> = getListingRepo();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 400;
    const skip = (page - 1) * limit;

    const search = req.query.search as string | undefined;
    console.log('🚀 ~ getAllListings ~ search:', typeof search);

    let listings;
    if (search) {
      listings = await listingRepo.findAndCount({
        select: [
          'slug',
          'make',
          'model',
          'color',
          'price',
          'fuelType',
          'name',
          'status',
        ],
        where: [
          { name: ILike(`%${search}%`) },
          { chassisNo: ILike(`%${search}%`) },
          { make: ILike(`%${search}%`) },
          { model: ILike(`%${search}%`) },
          { color: ILike(`%${search}%`) },
        ],
        take: limit,
        skip: skip,
        order: { id: 'DESC' },
      });
    } else {
      listings = await listingRepo.findAndCount({
        select: [
          'slug',
          'make',
          'model',
          'color',
          'price',
          'fuelType',
          'name',
          'status',
        ],
        take: limit,
        skip: skip,
        order: { id: 'DESC' },
      });
    }

    if (!listings) return next(new AppError('No listings found', 400));

    return res
      .status(200)
      .json({ success: true, data: listings[0], totalRecords: listings[1] });
  }
);

export const getListingDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const slug = req.params.slug;
    const listingRepo: Repository<Listing> = getListingRepo();

    const listing = await listingRepo.findOne({ where: { slug } });

    if (!listing) return next(new AppError('Listing not found', 404));

    res.status(200).json({
      status: 'success',
      data: { listing },
    });
  }
);
export const toggleActiveListing = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status } = req.body;
    if (!status) return next(new AppError('Please provide a status', 404));

    const slug = req.params.slug;
    console.log('🚀 ~ slug:', slug);
    const listingRepo: Repository<Listing> = getListingRepo();

    const listing = await listingRepo.findOne({ where: { slug } });

    if (!listing) return next(new AppError('Listing not found', 404));

    if (listing.status === status)
      throw next(new AppError('Status already set', 400));

    listing.status = status;
    await listingRepo.save(listing);

    res.status(200).json({
      status: 'success',
      data: { listing },
    });
  }
);
export const updateListing = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
console.log("req.body",req.body)
    const slug = req.params.slug;
    
    const files = req.files as { [fieldname: string]: S3File[] };

    const listingRepo: Repository<Listing> = getListingRepo();

    const listing = await listingRepo.findOne({ where: { slug } });

    console.log("🚀 ~ listing:", listing)
    if (!listing) return next(new AppError('Listing not found', 404));

   if(files.photos) {req.body.photos = files.photos.map((photo)=>photo.key)
    await Promise.all(listing.photos.map((photo) => deleteImage(photo)));
   }
  
   Object.assign(listing, req.body);
   await listingRepo.save(listing);
   
    res.status(200).json({
      status: 'success',
      data: { listing },
    });
  }
);