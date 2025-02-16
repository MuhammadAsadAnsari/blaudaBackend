const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const User = require('./models/userModel');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const cmsRouter = require('./routes/cmsRoutes');
const userRouter = require('./routes/userRoutes');
const packageRouter = require('./routes/packageRoutes');
const newsLetterRouter = require('./routes/newsLetterRoutes');
const NotificationsRouter = require('./routes/notificationRoutes');
const crudRouter = require('./routes/crudRoutes');
const privacyPolicyRouter = require('./routes/privacyPolicyRoutes');
const termsAndConditionsRouter = require('./routes/termsAndConditionsRoutes');
const bloomOrCharacterRouter = require('./routes/bloomOrCharacterRoutes');
const videosRouter = require('./routes/videoRoutes');
const categoriesRouter = require('./routes/categoryRoutes');
const tagsRouter = require('./routes/tagRoutes');
const resonanceFinderRouter = require('./routes/resonanceFinderRoutes');
const resonanceFinderQuestionRouter = require('./routes/resonanceFinderQuestionRoutes');
const commentRouter = require('./routes/commentRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const contactUsRouter = require('./routes/contactusRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc=require('swagger-jsdoc')

const Cms = require('./models/cmsModel');
const Video = require('./models/videoModel');

const app = require('express')();
const http = require('http').Server(app);
const io = require('./utils/socket').init(http);

app.enable('trust proxy');

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// PUG CONFIG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// EJS CONFIG
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/public', '/templates'));

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Set security HTTP headers
// app.use(helmet());
app.use(helmet.frameguard({ action: 'SAMEORIGIN' }));

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

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Video.updateMany({},{thumbnail:"c980d085-1f7b-46ca-ad3b-0290c3588937.jpeg"}).then((rs) => console.log('Inserted !!'));

app.use(compression());
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vibe Garden Apis Documentation",
      version: "1.0.0",
      description: "Vibegarden apis documentation with body and response examples and parameters",
    },
    servers: [
      {
        url: "http://localhost:3040/api/v1",
      },
      {
        url: "https://vibe-garden-backend.herokuapp.com/api/v1",
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
  apis: ["./routes/*.js"],
};

const specs = swaggerJsDoc(swaggerOptions)

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
// 3) ROUTES
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Vibe Garden APIs',
  });
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/packages', packageRouter);
app.use('/api/v1/newsLetter', newsLetterRouter);
app.use('/api/v1/cms', cmsRouter);
app.use('/api/v1/notifications', NotificationsRouter);
app.use('/api/v1/crud', crudRouter);
app.use('/api/v1/privacyPolicy', privacyPolicyRouter);
app.use('/api/v1/termsAndConditions', termsAndConditionsRouter);
app.use('/api/v1/bloom-or-character', bloomOrCharacterRouter);
app.use('/api/v1/videos', videosRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/tags', tagsRouter);
app.use('/api/v1/resonance-finder', resonanceFinderRouter);
app.use('/api/v1/resonance-finder-question', resonanceFinderQuestionRouter);
app.use('/api/v1/comment', commentRouter);
app.use('/api/v1/booking', bookingRouter);
app.use('/api/v1/contact-us', contactUsRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

exports.app = app;
exports.http = http;
