import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ ok: false, error: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+sessionVersion');

    if (!user) {
      return res.status(401).json({ ok: false, error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ ok: false, error: 'Account is deactivated' });
    }

    if (decoded.sessionVersion !== user.sessionVersion) {
      return res.status(401).json({ ok: false, error: 'Your session is no longer active. Please sign in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    const errorMessage = error.name === 'TokenExpiredError'
      ? 'Your session has expired. Please sign in again.'
      : 'Not authorized, token is invalid.';
    return res.status(401).json({ ok: false, error: errorMessage });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        error: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};
