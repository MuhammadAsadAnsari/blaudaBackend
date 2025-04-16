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


export const app = require('express')();
export const http = require('http').Server(app);

app.enable('trust proxy');

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// PUG CONFIG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// EJS CONFIG
app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, '/public', '/templates'));

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Set security HTTP headers
app.use(helmet());
app.use(helmet.frameguard({ action: 'sameorigin' }));


// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(compression());
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: " Apis Documentation",
      version: "1.0.0",
      description: "",
    },
    servers: [
      {
        url: "http://localhost:3040/api/v1",
      },
      
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: "http",
          scheme: "Bearer",
          bearerFormat: "JWT"
        },
      },
    },
    security: [
      {
        apiKey: [], // Empty array means it's an open security scheme
      },
    ],
  },
  apis: ["./routes/*.ts"],
};

const specs = swaggerJsDoc(swaggerOptions)

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
// 3) ROUTES
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to AM car selling APIs',
  });
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/contact-us', contactUsRouter);
app.use('/api/v1/listing', listingRouter);




app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);


