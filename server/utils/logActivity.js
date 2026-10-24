// Saves an entry to the activity log. Failures are logged but never break the request.
const ActivityLog = require('../models/ActivityLog');

const logActivity = async (user, entity, action) => {
  try {
    await ActivityLog.create({
      action,
      entity,
      performedBy: user?._id,
      performedByName: user?.name || 'System',
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
};

module.exports = logActivity;
