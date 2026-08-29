export default function notFound(_req, res) {
  res.status(404).json({
    ok: false,
    error: 'Not Found',
    message: 'This route is not available in the AutoPulse AI API.',
  });
}
