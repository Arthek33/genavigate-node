const multer = require('multer');
const sharp = require('sharp');
const Vehicle = require('../models/vehicleModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadVehicleImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
]);

exports.resizeVehicleImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover) return next();

  // 1) Cover image
  req.body.imageCover = `vehicle-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/vehicles/${req.body.imageCover}`);

  next();
});

exports.aliasTopVehicles = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getVehicleBySlug = catchAsync(async (req, res, next) => {
  const vehicle = await Vehicle.findOne({ slug: req.params.slug });

  if (!vehicle) {
    next(new AppError('This tour slug does not exists', 404));
  }

  res.status(200).json({
    status: 'success',
    vehicle,
  });
});

exports.getAllVehicles = factory.getAll(Vehicle);
exports.getVehicle = factory.getOne(Vehicle);
exports.createVehicle = factory.createOne(Vehicle);
exports.updateVehicle = factory.updateOne(Vehicle);
exports.deleteVehicle = factory.deleteOne(Vehicle);

// tours-within?distance=23,center=-40,45,unit=miles
// tours-within/233/center/34.109783,-118.126088/unit/mi
exports.getVehiclesWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const vehicles = await Vehicle.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: vehicles.length,
    data: {
      data: vehicles,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const distances = await Vehicle.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
