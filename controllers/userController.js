const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const uploadToFTP = require('../utils/uploadToFTP');
// IMAGE UPLOAD MIDDLEWARE

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-dqdsq789-32829372893.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  const processedImage = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();
  // .toFile(`public/img/users/${req.file.filename}`);
  await uploadToFTP(processedImage, req.file.filename, 'genavigate/img/users');
  // req.file.url = await uploadToFTP(
  //   processedImage,
  //   req.file.filename,
  //   'genavigate/img/users/',
  // );

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }
  // Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

exports.getFavoriteVehicles = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('favoriteVehicles');
  res.status(200).json({
    status: 'success',
    data: user.favoriteVehicles,
  });
});

exports.addFavoriteVehicle = catchAsync(async (req, res, next) => {
  const vehicle = req.body;

  const user = await User.findById(req.user.id);

  console.log(vehicle, user);
  if (user.favoriteVehicles.includes(vehicle.id)) {
    return next(new AppError('Vehicle already in favorites.', 400));
  }

  // Add the vehicleId to the user's favorites
  user.favoriteVehicles.push(vehicle.id);
  await user.save({ validateBeforeSave: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.deleteFavoriteVehicle = catchAsync(async (req, res, next) => {
  const { vehicleId } = req.params;

  const user = await User.findById(req.user.id);

  console.log(vehicleId, user);
  if (!user.favoriteVehicles.includes(vehicleId)) {
    return next(new AppError('Vehicle not found in favorites.', 400));
  }

  // Add the vehicleId to the user's favorites
  user.favoriteVehicles.pull(vehicleId);
  await user.save({ validateBeforeSave: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// DO NOT Update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
