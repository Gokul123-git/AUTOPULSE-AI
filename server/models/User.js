import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['vehicle_owner', 'service_center', 'fleet_manager', 'admin'],
      default: 'vehicle_owner',
    },
    avatar: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: { type: String, select: false },
    sessionVersion: { type: Number, default: 0, select: false },
    googleId: { type: String },
    preferences: {
      darkMode: { type: Boolean, default: false },
      language: { type: String, default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
      },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: this.role, sessionVersion: this.sessionVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '90d',
  });
};

const User = mongoose.model('User', userSchema);
export default User;
