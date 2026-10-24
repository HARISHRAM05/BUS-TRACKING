// User model - students, staff and Transport Office admins
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false -> the hash is never returned by queries unless explicitly asked for
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['Admin', 'User'], default: 'User' },
    // Only meaningful for normal users
    userType: { type: String, enum: ['Student', 'Staff', null], default: null },
    registerNo: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

// Hash the password whenever it is created or changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare a plain-text password with the stored hash
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Safety net: strip the password from any JSON output
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
