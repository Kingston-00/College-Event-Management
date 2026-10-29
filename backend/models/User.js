const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  department: { type: String, trim: true, default: '' },
  year: { type: Number, min: 1, max: 6 },
  rollNumber: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Hash the password whenever it is new or changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
