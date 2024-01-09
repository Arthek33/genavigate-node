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
