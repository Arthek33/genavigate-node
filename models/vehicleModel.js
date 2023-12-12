const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [30, 'A tour name must have less or equal than 30 characters'],
      minlength: [3, 'A tour name must have more or equal than 3 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contains characters'],
    },
    slug: String,
    vehicleType: {
      type: String,
      required: [true, 'A vehicle must have a type'],
      enum: {
        values: ['bike', 'car', 'boat', 'plane'],
        message: 'Type is either : bike, car, boat or plane',
      },
    },
    price: {
      type: Number,
      required: [true, 'A vehicle must have a price'],
    },
    speed: {
      type: Number,
      required: [true, 'A vehicle must have a speed'],
    },
    location: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    imageCover: {
      type: String,
      required: [true, 'A vehicle must have a cover image'],
    },
    gltf: {
      type: String,
      // required: [true, 'A vehicle must have a gitf file'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

vehicleSchema.index({ price: 1 });
vehicleSchema.index({ slug: 1 });
vehicleSchema.index({ location: '2dsphere' });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
vehicleSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
