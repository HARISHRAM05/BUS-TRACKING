// Announcement model - notices from the Transport Office (delays, route changes, holidays, ...)
const mongoose = require('mongoose');

const SEVERITIES = ['Info', 'Warning', 'Urgent'];

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    severity: { type: String, enum: SEVERITIES, default: 'Info' },
    // null = shown to everyone; otherwise only relevant to riders of that route
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    // null = never expires; after this moment the notice is hidden from riders
    expiresAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: 'Transport Office' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
module.exports.SEVERITIES = SEVERITIES;
