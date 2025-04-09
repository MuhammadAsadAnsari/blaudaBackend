import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { IListing } from '../interfaces/listingInterface';
import {
  Between,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { Listing } from '../models/listngEntity';
import { AppDataSource } from '../server';
import { S3File } from '../interfaces/s3Interface';
import AppError from '../utils/appError';
import { deleteImage } from '../utils/s3';

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
      mileage,
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
    } = req.body;
    const files = req.files as { [fieldname: string]: S3File[] };

    console.log('req.body', req.body);
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
      !mileage ||
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
      location: location.toLowerCase(),
      city: city.toLowerCase(),
      offerNo: offerNo.toLowerCase(),
      chassisNo: chassisNo.toLowerCase(),
      carStatus: carStatus.toLowerCase(),
      make: make.toLowerCase(),
      model: model.toLowerCase(),
      grade: grade.toLowerCase(),
      modelYear,
      manufactured: manufactured.toLowerCase(),
      firstRegistrationDate: firstRegistrationDate.toLowerCase(),
      engineSize: engineSize.toLowerCase(),
      mileage,
      seats: seats.toLowerCase(),
      driveType: driveType.toLowerCase(),
      bodyType: bodyType.toLowerCase(),
      steering: steering.toLowerCase(),
      transmission: transmission.toLowerCase(),
      color: color.toLowerCase(),
      price: price.toLowerCase(),
      fuelType: fuelType.toLowerCase(),
      name: name.toLowerCase(),
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
    const slug = req.params.slug;

    const files = req.files as { [fieldname: string]: S3File[] };

    const listingRepo: Repository<Listing> = getListingRepo();

    const listing = await listingRepo.findOne({ where: { slug } });

    if (!listing) return next(new AppError('Listing not found', 404));

    // Ensure body is parsed
    if (typeof req.body.data === 'string') {
      req.body.data = JSON.parse(req.body.data);
    }

    if (files.photos) {
      req.body.data.photos = files.photos.map((photo) => photo.key);
    }

    Object.assign(listing, req.body.data);

    await listingRepo.save(listing);

    res.status(200).json({
      status: 'success',
      data: { listing },
    });
  }
);

export const getListingDetailsForUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const slug = req.params.slug;
    const listingRepo: Repository<Listing> = getListingRepo();

    const listing = await listingRepo.findOne({
      where: { slug, status: 'Active' },
      select: [
        'make',
        'model',
        'location',
        'city',
        'offerNo',
        'chassisNo',
        'carStatus',
        'grade',
        'modelYear',
        'manufactured',
        'firstRegistrationDate',
        'engineSize',
        'mileage',
        'seats',
        'driveType',
        'bodyType',
        'steering',
        'transmission',
        'color',
        'price',
        'fuelType',
        'name',
        'photos',
        'From',
      ],
    });

    if (!listing) return next(new AppError('Listing not found', 404));

    res.status(200).json({
      status: 'success',
      data: { listing },
    });
  }
);
export const getAllListingsForHomePage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const slug = req.params.slug;
    console.log('🚀 ~ slug:', slug);

    const listingRepo: Repository<Listing> = getListingRepo();

    const recommendedListings = await listingRepo.find({
      where: { status: 'Active' },
      select: [
        'slug',
        'name',
        'modelYear',
        'city',
        'location',
        'price',
        'photos',
      ],
      order: { id: 'DESC' },
      take: 12,
    });

    if (!recommendedListings)
      return next(new AppError('Listing not found', 404));

    const dubaiListings = await listingRepo.find({
      where: { From: 'Dubai', status: 'Active' },
      select: [
        'slug',
        'name',
        'modelYear',
        'city',
        'location',
        'price',
        'photos',
      ],
      order: { id: 'DESC' },
      take: 12,
    });

    if (!dubaiListings) return next(new AppError('Listing not found', 404));

    const japanListings = await listingRepo.find({
      where: { From: 'Japan', status: 'Active' },
      select: [
        'slug',
        'name',
        'modelYear',
        'city',
        'location',
        'price',
        'photos',
      ],
      order: { id: 'DESC' },
      take: 12,
    });

    if (!japanListings) return next(new AppError('Listing not found', 404));

    const thailandListings = await listingRepo.find({
      where: { From: 'Thailand', status: 'Active' },
      select: [
        'slug',
        'name',
        'modelYear',
        'city',
        'location',
        'price',
        'photos',
      ],
      order: { id: 'DESC' },
      take: 12,
    });

    if (!thailandListings) return next(new AppError('Listing not found', 404));

    res.status(200).json({
      status: 'success',
      data: {
        recommendedListings,
        dubaiListings,
        japanListings,
        thailandListings,
      },
    });
  }
);
export const getListingsCount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const slug = req.params.slug;
    console.log('🚀 ~ slug:', slug);
    const listingRepo: Repository<Listing> = getListingRepo();
    console.log('🚀 ~ listingRepo:', listingRepo);

    const data = await listingRepo.count({
      where: { status: 'Active' },
    });

    res.status(200).json({
      status: 'success',
      data,
    });
  }
);
export const getAllListingsForUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const listingRepo: Repository<Listing> = getListingRepo();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 400;
    const skip = (page - 1) * limit;

    const {
      make,
      model,
      color,
      bodyType,
      minYear,
      maxYear,
      minKm,
      maxKm,
      transmission,
      fuelType,
      search,
      From,
    } = req.body;

    console.log('🚀 ~ getAllListings ~ search:', make, model);

    // Apply search filter

    let whereConditions: any = {
      ...(make && { make: make.toLowerCase() }),
      ...(model && { model: model.toLowerCase() }),
      ...(color && { color: color.toLowerCase() }),
      ...(bodyType && { bodyType: bodyType.toLowerCase() }),
      ...(transmission && { transmission: transmission.toLowerCase() }),
      ...(fuelType && { fuelType: fuelType.toLowerCase() }),
      ...(From && From !== 'all' && { From }),
      status: 'Active',
      ...(minYear && { modelYear: MoreThanOrEqual(minYear) }),
      ...(maxYear && { modelYear: LessThanOrEqual(maxYear) }),

      // Apply mileage conditions
      ...(minKm && { mileage: MoreThanOrEqual(minKm) }),
      ...(maxKm && { mileage: LessThanOrEqual(maxKm) }),
    };
    if (search) {
      whereConditions = [
        { name: ILike(`%${search}%`) },
        { chassisNo: ILike(`%${search}%`) },
        { make: ILike(`%${search}%`) },
        { model: ILike(`%${search}%`) },
        { color: ILike(`%${search}%`) },
      ];
    }

    // Apply other filters dynamically

    const listings = await listingRepo.findAndCount({
      select: [
        'slug',
        'name',
        'modelYear',
        'chassisNo',
        'steering',
        'price',
        'photos',
        'fuelType',
        'color',
        'mileage',
        'model',
      ],
      where: whereConditions,
      take: limit,
      skip: skip,
      order: { id: 'DESC' },
    });

    if (!listings) return next(new AppError('No listings found', 400));

    return res
      .status(200)
      .json({ success: true, data: listings[0], totalRecords: listings[1] });
  }
);
export const getAllRecommendedListingsForUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const listingRepo: Repository<Listing> = getListingRepo();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 400;
    const skip = (page - 1) * limit;

    const slug = req.params.slug;

    const model = req.body.model;

    if (!slug) return next(new AppError('Please provide car slug', 404));

    const foundListing = await listingRepo.findOne({
      where: { slug, status: 'Active' },
    });

    if (!foundListing) return next(new AppError('Car not found', 404));

    const listings = await listingRepo.findAndCount({
      select: [
        'slug',
        'name',
        'modelYear',
        'chassisNo',
        'steering',
        'price',
        'photos',
        'fuelType',
        'color',
        'mileage',
        'model',
      ],
      where: {
        model: ILike(`%${model}%`),
        slug: Not(slug),
      },
      take: limit,
      skip: skip,
      order: { id: 'DESC' },
    });

    if (!listings) return next(new AppError('No listings found', 400));

    return res
      .status(200)
      .json({ success: true, data: listings[0], totalRecords: listings[1] });
  }
);
