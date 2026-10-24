// Schedule model - a timed trip of a bus on a route
const mongoose = require('mongoose');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const scheduleSchema = new mongoose.Schema(
  {
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    departureTime: { type: String, required: true }, // "HH:MM"
    arrivalTime: { type: String, required: true }, // "HH:MM"
    direction: { type: String, enum: ['To Campus', 'From Campus'], required: true },
    daysOfOperation: { type: [{ type: String, enum: DAYS }], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    shift: { type: String, enum: ['Morning', 'Evening'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Schedule', scheduleSchema);
module.exports.DAYS = DAYS;
