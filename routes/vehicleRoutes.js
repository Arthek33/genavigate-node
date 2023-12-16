const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(vehicleController.getAllVehicles)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    vehicleController.createVehicle,
  );

router.route('/slug/:slug').get(vehicleController.getVehicleBySlug);

router
  .route('/:id')
  .get(vehicleController.getVehicle)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    vehicleController.updateVehicle,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    vehicleController.deleteVehicle,
  );

module.exports = router;

// router
//   .route('/')
//   .get(tourController.getAllTours)
//   .post(
//     authController.protect,
//     authController.restrictTo('admin', 'lead-guide'),
//     tourController.createTour,
//   );

// router
//   .route('/:id')
//   .get(tourController.getTour)
//   .patch(
//     authController.protect,
//     authController.restrictTo('admin', 'lead-guide'),
//     tourController.uploadTourImages,
//     tourController.resizeTourImages,
//     tourController.updateTour,
//   )
//   .delete(
//     authController.protect,
//     authController.restrictTo('admin', 'lead-guide'),
//     tourController.deleteTour,
//   );
