// Route model - a bus route between a Coimbatore area and Karunya Nagar campus
const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    stopName: { type: String, required: true, trim: true },
    pickupTime: { type: String, required: true }, // "HH:MM" (24-hour)
    order: { type: Number, required: true, min: 1 },
    // Optional map position of the stop (needed to draw the route on the map)
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true, trim: true },
    routeCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    startPoint: { type: String, required: true, trim: true },
    // The campus is the common endpoint for every route
    endPoint: { type: String, default: 'Karunya Nagar Campus', trim: true },
    stops: { type: [stopSchema], default: [] },
    distanceKm: { type: Number, required: true, min: 0 },
    assignedBus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
  },
  { timestamps: true }
);

// Always keep stops sorted by their order number
routeSchema.pre('save', function (next) {
  this.stops.sort((a, b) => a.order - b.order);
  next();
});

module.exports = mongoose.model('Route', routeSchema);
