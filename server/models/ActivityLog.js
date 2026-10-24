// ActivityLog model - records admin actions for the "Recent activity" panel
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. "Created bus KU-07"
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String, default: 'System' },
  entity: { type: String, enum: ['Bus', 'Route', 'Schedule', 'User', 'Auth'], required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
