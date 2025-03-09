
import { Request } from "express";
import { User } from "../models/userEntity";
export interface IUser extends Request {
  user?: User;
}
