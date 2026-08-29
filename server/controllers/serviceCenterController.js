import ServiceCenter from '../models/ServiceCenter.js';

const defaultCenters = [
  {
    name: 'AutoPulse Enterprise Central Hub',
    address: 'Plot 42, Tech Park Corridor, Sector 5',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    phone: '+91 98765 43210',
    email: 'service@autopulse.ai',
    rating: 4.9,
    services: ['Routine Maintenance', 'Engine Diagnostics', 'EV Battery Health Check', 'Tyre & Wheel Alignment', 'Brake Systems'],
    specializations: ['Tesla', 'Tata EV', 'Mahindra Electric', 'Luxury Sedans', 'Heavy Fleet'],
    isActive: true,
  },
  {
    name: 'Apex Fleet Motors & Heavy Care',
    address: '88 Industrial Estate Ring Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400018',
    phone: '+91 98220 11223',
    email: 'mumbai@apexfleet.com',
    rating: 4.8,
    services: ['Complete Overhaul', 'AC Repair & Refill', 'Suspension Tuning', 'Emergency Breakdown Repair'],
    specializations: ['Commercial Trucks', 'Buses', 'SUVs', 'Diesel Hydraulics'],
    isActive: true,
  },
  {
    name: 'Bosch Certified Telematics Mobility Hub',
    address: '104 Airport Road, Automated Fleet Zone',
    city: 'Delhi NCR',
    state: 'Delhi',
    pincode: '110037',
    phone: '+91 99112 33445',
    email: 'support@bosch-telematics.in',
    rating: 4.9,
    services: ['AI Health Reading', 'Sensor Calibration', 'ECU Reprogramming', 'Electrical System Diagnostics'],
    specializations: ['All Makes', 'Hybrid & EV', 'Connected Fleets'],
    isActive: true,
  },
];

export const getServiceCenters = async (req, res) => {
  try {
    let centers = await ServiceCenter.find({ isActive: true }).sort('-rating');
    
    // Auto-seed default centers if database is empty so booking dropdown is ready
    if (centers.length === 0 && req.user?._id) {
      const seeded = defaultCenters.map((c) => ({ ...c, user: req.user._id }));
      centers = await ServiceCenter.insertMany(seeded);
    }
    
    res.status(200).json({ ok: true, count: centers.length, centers });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const getServiceCenterById = async (req, res) => {
  try {
    const center = await ServiceCenter.findById(req.params.id);
    if (!center) return res.status(404).json({ ok: false, error: 'Service center not found' });
    res.status(200).json({ ok: true, center });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const createServiceCenter = async (req, res) => {
  try {
    const center = await ServiceCenter.create({ ...req.body, user: req.user._id });
    res.status(201).json({ ok: true, center });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const updateServiceCenter = async (req, res) => {
  try {
    const center = await ServiceCenter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!center) return res.status(404).json({ ok: false, error: 'Service center not found' });
    res.status(200).json({ ok: true, center });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteServiceCenter = async (req, res) => {
  try {
    const center = await ServiceCenter.findByIdAndDelete(req.params.id);
    if (!center) return res.status(404).json({ ok: false, error: 'Service center not found' });
    res.status(200).json({ ok: true, message: 'Service center deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
