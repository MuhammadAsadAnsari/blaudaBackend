import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { ILike, Repository } from 'typeorm';
import { ContactUs } from '../models/contactusEntity';
import { AppDataSource } from '../server';
import { IContactUs } from '../interfaces/ContactusInterface';
import AppError from '../utils/appError';

const getContactUsRepo = (): Repository<ContactUs> => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database is not initialized yet!');
  }
  return AppDataSource.getRepository(ContactUs);
};

export const addContactUs = catchAsync(
  async (req: IContactUs, res: Response, next: NextFunction) => {
    const { name, email, phoneNumber, requirements } = req.body;
console.log("REQ.BODY",name,email,phoneNumber,req.body)
    if (!name || !email || !phoneNumber || !requirements)
      return next(new AppError('All fields are required', 400));

    const ContactUsRepo: Repository<ContactUs> = getContactUsRepo();

    // Get the latest ID
    const lastContact = await ContactUsRepo.findOne({
      where: {},
      order: { id: 'DESC' }, // Get the most recent entry
    });
    

 const newId = (lastContact?.id ?? 0) + 1;
 // Increment last ID or start from 1

    const data = ContactUsRepo.create({
      name,
      email,
      phoneNumber,
      requirements,
      slug: `contactUs-${newId}`,
    });

    await ContactUsRepo.save(data);

    return res.status(201).json({ success: true, data });
  }
);
export const getAllContactUs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const contactUsRepo: Repository<ContactUs> = getContactUsRepo();

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 400;
    const skip = (page - 1) * limit;

    const search = req.query.search as string | undefined;
    console.log('🚀 ~ getAllListings ~ search:', typeof search);

    let data;
    if (search) {
      data = await contactUsRepo.findAndCount({
        order: { id: 'DESC' },
        where: [
          { name: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { phoneNumber: ILike(`%${search}%`) },
        ],
        select: ['name', 'email', 'phoneNumber', 'requirements'],
        take: limit,
        skip: skip,
      });
    } else {
      data = await contactUsRepo.findAndCount({
        select: ['name', 'email', 'phoneNumber', 'requirements'],

        take: limit,
        skip: skip,
        order: { id: 'DESC' },
      });
    }

    if (!data) return next(new AppError('No Queries found', 400));

    return res
      .status(200)
      .json({ success: true, data: data[0], totalRecords: data[1] });
  }
);