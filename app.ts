import path from 'path';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
// const User = require('./models/userModel');

import AppError from './utils/appError';
import globalErrorHandler from './controllers/errorController';
import userRouter from './routes/userRoutes';
import adminRouter from './routes/adminRoutes';
import contactUsRouter from './routes/contactusRoute';
import listingRouter from "./routes/listingRoutes"

import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { listenerCount } from 'process';
import 'dotenv/config';
