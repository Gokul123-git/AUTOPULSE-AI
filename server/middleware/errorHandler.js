export default function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ ok: false, error: Object.values(err.errors).map((item) => item.message).join(' ') });
  }
  if (err.code === 11000) {
    return res.status(409).json({ ok: false, error: 'That value is already in use. Please use a different one.' });
  }
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Internal Server Error',
  });
}
