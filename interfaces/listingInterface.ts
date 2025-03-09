import { Request } from "express";
import { Listing } from "../models/listngEntity";

export interface IListing extends Request {
  listing?: Listing,
}
