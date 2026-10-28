// Issue model - a problem reported by a rider (late bus, overcrowding, breakdown, lost item, ...)
const mongoose = require('mongoose');

const CATEGORIES = ['Bus late', 'Overcrowded', 'Breakdown', 'Driver behaviour', 'Safety concern', 'Lost item', 'Other'];
const STATUSES = ['Open', 'In progress', 'Resolved'];

const issueSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    message: { type: String, required: true, trim: true, maxlength: 600 },
    status: { type: String, enum: STATUSES, default: 'Open' },
    // Reply from the Transport Office, shown to the rider
    adminNote: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Issue', issueSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
