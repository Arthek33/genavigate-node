const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const vehiclesRouter = require('./routes/vehicleRoutes');
const userRouter = require('./routes/userRoutes');
// const viewRouter = require('./routes/viewRoutes');
// const tourRouter = require('./routes/tourRoutes');
// const userRouter = require('./routes/userRoutes');
// const reviewRouter = require('./routes/reviewRoutes');
// const bookingRouter = require('./routes/bookingRoutes');
// const viewRouter = require('./routes/viewRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
// Implement CORS
// app.use(cors());

// // handle complex requests (delete,put,patch) not handled by simple cors middleware by default
// // (complex requests send an option request before performing the complex request)
// // app.options('*', cors());
// app.options('http://localhost:3001', cors());

const corsOptions = {
  origin: process.env.ALLOW_ORIGIN, // Specify your frontend origin
  credentials: true, // This is important for cookies
};

app.use(cors(corsOptions));

// Serving static files
// app.use(express.static(`${__dirname}/public/`));
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
// app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
// app.use('/', viewRouter);
// app.use('/', viewRouter);
app.use('/api/v1/vehicles', vehiclesRouter);
app.use('/api/v1/users', userRouter);

// app.use('/api/v1/tours', tourRouter);
// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/reviews', reviewRouter);
// app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // everything in next function is comprehended by express as an error
  // and will skip all the next middleware until the error middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4 parameters means error middleware for Express
app.use(globalErrorHandler);

module.exports = app;
