import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendEmail } from '../utils/sendEmail.js';


const generateTokenResponse = (user) => {
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  return {
    token,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      preferences: user.preferences,
    },
  };
};

const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

const validateCredentials = ({ name, email, password }, requireName = false) => {
  if (requireName && String(name || '').trim().length < 2) return 'Please enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(normaliseEmail(email))) return 'Please enter a valid email address.';
  if (String(password || '').length < 6) return 'Password must be at least 6 characters.';
  return null;
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, password, phone, role } = req.body;
    const email = normaliseEmail(req.body.email);
    const validationError = validateCredentials({ name, email, password }, true);
    if (validationError) return res.status(400).json({ ok: false, error: validationError });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ ok: false, error: 'Email already registered' });
    }

    const allowedRegistrationRoles = ['vehicle_owner', 'service_center', 'fleet_manager'];
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: allowedRegistrationRoles.includes(role) ? role : 'vehicle_owner',
    });

    // Send welcome notification
    await Notification.create({
      recipient: user._id,
      type: 'system',
      title: 'Welcome to AutoPulse AI',
      message: `Welcome ${user.name}! Your account has been created. Start by adding your first vehicle.`,
      priority: 'low',
    });

    const response = generateTokenResponse(user);
    user.refreshToken = response.refreshToken;
    await user.save();
    res.status(201).json({ ok: true, ...response });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ ok: false, error: 'An account with this email already exists.' });
    res.status(500).json({ ok: false, error: 'Unable to create your account. Please try again.' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const email = normaliseEmail(req.body.email);
    const { password } = req.body;
    const validationError = validateCredentials({ email, password });
    if (validationError) return res.status(400).json({ ok: false, error: validationError });

    const user = await User.findOne({ email }).select('+password +sessionVersion');
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ ok: false, error: 'Account is deactivated. Contact support.' });
    }

    user.lastLogin = new Date();
    const response = generateTokenResponse(user);
    user.refreshToken = response.refreshToken;
    await user.save();
    res.status(200).json({ ok: true, ...response });
  } catch (_error) {
    res.status(500).json({ ok: false, error: 'Unable to sign in right now. Please try again.' });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/auth/me
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, preferences, avatar } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (preferences) updateFields.preferences = preferences;
    if (avatar) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updateFields, { new: true, runValidators: true });

    res.status(200).json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /api/auth/password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || String(newPassword || '').length < 6) {
      return res.status(400).json({ ok: false, error: 'Current password and a new password of at least 6 characters are required.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ ok: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ ok: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 }, $inc: { sessionVersion: 1 } });
    res.status(200).json({ ok: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Unable to log out. Please try again.' });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ ok: false, error: 'No user found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'AutoPulse AI - Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a56db;">AutoPulse AI</h1>
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1a56db; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
            <p style="margin-top: 24px;">This link expires in 30 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      res.status(200).json({ ok: true, message: 'Password reset email sent' });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ ok: false, error: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ ok: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: rt } = req.body;
    if (!rt) {
      return res.status(400).json({ ok: false, error: 'refreshToken is required' });
    }

    const decoded = jwt.verify(rt, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken +sessionVersion');

    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid refresh token' });
    }

    if (user.refreshToken !== rt) {
      return res.status(401).json({ ok: false, error: 'Refresh token does not match' });
    }

    // Always rotate refresh token to reduce replay risk
    const response = generateTokenResponse(user);
    // Persist the newly generated refresh token
    user.refreshToken = response.refreshToken;
    await user.save();

    res.status(200).json({ ok: true, ...response });
  } catch (_error) {
    res.status(401).json({ ok: false, error: 'Invalid or expired refresh token' });
  }
};


// GET /api/auth/verify-email/:token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({ ok: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
