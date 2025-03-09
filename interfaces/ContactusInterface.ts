import { Request } from 'express';
import { ContactUs } from '../models/contactusEntity';

export interface IContactUs extends Request {
  contactUs?: ContactUs;
}
