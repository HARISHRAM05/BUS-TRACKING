// Bus model - one document per college bus
const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    registrationNo: { type: String, required: true, trim: true, uppercase: true },
    capacity: { type: Number, required: true, min: 1 },
    driverName: { type: String, required: true, trim: true },
    driverPhone: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Maintenance', 'Inactive'], default: 'Active' },
    // Last known position. 'gps' = reported by a tracker/device, 'simulated' = demo simulator
    location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
      source: { type: String, enum: ['simulated', 'gps'] },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bus', busSchema);
