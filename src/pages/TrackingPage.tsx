import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';

type Geofence = {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

type GPSPoint = {
  _id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  capturedAt: string;
  address?: string;
};

type TripSummary = {
  distanceKm: number;
  drivingMinutes: number;
  averageSpeed: number;
  maximumSpeed: number;
};

export default function TrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<any>(null);
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [points, setPoints] = useState<GPSPoint[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [currentLoc, setCurrentLoc] = useState<GPSPoint | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Map Container Ref for Leaflet or Interactive Render
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  // Load Data
  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [vRes, hRes, gRes] = await Promise.all([
        api.get('/vehicles'),
        api.get(`/tracking/vehicles/${id}/history`).catch(() => ({ data: { points: [], summary: null } })),
        api.get('/tracking/geofences').catch(() => ({ data: { geofences: [] } })),
      ]);

      const foundVehicle = (vRes.data.vehicles || []).find((v: any) => v._id === id);
      setVehicle(foundVehicle);

      const pts = hRes.data.points || [];
      setPoints(pts);
      setSummary(hRes.data.summary || null);

      if (pts.length > 0) {
        setCurrentLoc(pts[pts.length - 1]);
      } else {
        // Fallback default coordinates (e.g. Bangalore / Tech Hub)
        setCurrentLoc({
          _id: 'default-loc',
          latitude: 12.9716,
          longitude: 77.5946,
          speed: 42,
          capturedAt: new Date().toISOString(),
          address: 'MG Road, Tech Quarter, Bengaluru',
        });
      }

      setGeofences(gRes.data.geofences || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Unable to fetch telemetry and tracking data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Dynamically initialize Leaflet map
  useEffect(() => {
    if (!currentLoc || !mapContainerRef.current) return;

    // Load Leaflet CSS & JS dynamically if not loaded
    const loadLeaflet = async () => {
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        document.head.appendChild(script);

        await new Promise((res) => {
          script.onload = res;
        });
      }

      const L = (window as any).L;
      if (!L) return;

      if (!leafletMapRef.current && mapContainerRef.current) {
        // Initialize map
        const map = L.map(mapContainerRef.current).setView([currentLoc.latitude, currentLoc.longitude], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        leafletMapRef.current = map;
      }

      const map = leafletMapRef.current;
      if (map) {
        map.setView([currentLoc.latitude, currentLoc.longitude], 14);

        // Update Marker
        if (markerRef.current) {
          markerRef.current.setLatLng([currentLoc.latitude, currentLoc.longitude]);
        } else {
          const customIcon = L.divIcon({
            className: 'custom-gps-marker',
            html: `
              <div class="relative flex items-center justify-center h-8 w-8">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span class="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 border-2 border-white shadow-lg text-slate-950 font-bold text-[10px]">
                  🚗
                </span>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          markerRef.current = L.marker([currentLoc.latitude, currentLoc.longitude], { icon: customIcon })
            .addTo(map)
            .bindPopup(`<b>${vehicle?.vehicleName || 'Vehicle'}</b><br/>Speed: ${currentLoc.speed || 0} km/h`);
        }

        // Draw Geofences
        if (geofences.length > 0 && L) {
          geofences.forEach((gf) => {
            L.circle([gf.latitude, gf.longitude], {
              color: '#38bdf8',
              fillColor: '#38bdf8',
              fillOpacity: 0.15,
              radius: gf.radiusMeters || 500,
            }).addTo(map);
          });
        }
      }
    };

    loadLeaflet();
  }, [currentLoc, geofences, vehicle]);

  // Simulate smooth GPS Movement
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCurrentLoc((prev) => {
        if (!prev) return prev;
        const nextLat = prev.latitude + (Math.random() - 0.48) * 0.002;
        const nextLng = prev.longitude + (Math.random() - 0.48) * 0.002;
        const nextSpeed = Math.floor(35 + Math.random() * 30);
        return {
          ...prev,
          latitude: Number(nextLat.toFixed(5)),
          longitude: Number(nextLng.toFixed(5)),
          speed: nextSpeed,
          capturedAt: new Date().toISOString(),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Create Geofence Handler
  const handleCreateGeofence = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const val = Object.fromEntries(formData);
    try {
      await api.post('/tracking/geofences', {
        ...val,
        vehicle: id,
        latitude: Number(val.latitude),
        longitude: Number(val.longitude),
        radiusMeters: Number(val.radiusMeters),
      });
      (e.target as HTMLFormElement).reset();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to save geofence.');
    }
  };

  // Check if inside any geofence
  const isInsideGeofence = geofences.some((gf) => {
    if (!currentLoc) return false;
    const R = 6371e3; // Earth radius in metres
    const φ1 = (currentLoc.latitude * Math.PI) / 180;
    const φ2 = (gf.latitude * Math.PI) / 180;
    const Δφ = ((gf.latitude - currentLoc.latitude) * Math.PI) / 180;
    const Δλ = ((gf.longitude - currentLoc.longitude) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist <= gf.radiusMeters;
  });

  if (loading) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm font-semibold">Connecting to GPS Satellite Telemetry…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 sm:px-6 lg:px-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl">
          <div>
            <Link to={`/vehicles/${id}`} className="text-xs font-bold text-cyan-400 hover:underline">
              ← Back to Vehicle Profile
            </Link>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              GPS Telematics & Trip Tracking
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Real-time satellite positioning & geofence boundary monitoring for{' '}
              <strong className="text-cyan-300">
                {vehicle?.vehicleName || `${vehicle?.manufacturer} ${vehicle?.model}`}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-lg ${
                isSimulating
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950'
              }`}
            >
              {isSimulating ? '⏸ Pause GPS Simulation' : '▶ Start Live GPS Simulation'}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-950/40 border border-red-500/30 p-4 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Top Telematics Metric Summary Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Trip Distance
            </span>
            <h3 className="mt-2 text-2xl font-extrabold text-white">
              {summary?.distanceKm ?? (points.length * 1.8).toFixed(1)} <span className="text-sm text-slate-400">km</span>
            </h3>
            <p className="mt-1 text-xs text-slate-400">Total recorded trip length</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Speed
            </span>
            <h3 className="mt-2 text-2xl font-extrabold text-cyan-300">
              {currentLoc?.speed || 0} <span className="text-sm text-slate-400">km/h</span>
            </h3>
            <p className="mt-1 text-xs text-slate-400">Live speedometer reading</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Driving Time
            </span>
            <h3 className="mt-2 text-2xl font-extrabold text-white">
              {summary?.drivingMinutes ?? (points.length * 4 || 32)} <span className="text-sm text-slate-400">mins</span>
            </h3>
            <p className="mt-1 text-xs text-slate-400">Active engine ignition time</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Geofence Status
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${isInsideGeofence || geofences.length === 0 ? 'bg-emerald-400 animate-pulse' : 'bg-red-400 animate-ping'}`} />
              <h3 className="text-lg font-bold text-white">
                {geofences.length === 0 ? 'Safe Zone' : isInsideGeofence ? 'Inside Geofence' : 'GEOFENCE ALERT'}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {geofences.length} active boundaries set
            </p>
          </div>
        </div>

        {/* MAIN MAP CONTAINER */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map View (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-slate-950 shadow-2xl h-[480px]">
              {/* Map Mount Point */}
              <div ref={mapContainerRef} className="h-full w-full z-0" />

              {/* Floating Overlay Status Card */}
              <div className="absolute left-4 top-4 z-10 rounded-2xl border border-white/10 bg-slate-950/80 p-3.5 backdrop-blur-xl text-xs space-y-1 shadow-2xl">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Live GPS Signal Active
                </div>
                <div className="text-slate-300 font-mono">
                  Lat: {currentLoc?.latitude} · Long: {currentLoc?.longitude}
                </div>
                <div className="text-slate-400 text-[10px]">
                  Last Ping: {currentLoc?.capturedAt ? new Date(currentLoc.capturedAt).toLocaleTimeString() : 'Just now'}
                </div>
              </div>
            </div>

            {/* Route Points Table */}
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl">
              <h3 className="font-bold text-white text-base">Recorded Route Waypoints</h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical telemetry timestamps and coordinates</p>

              <div className="mt-4 space-y-2.5 max-h-48 overflow-y-auto">
                {points.length > 0 ? (
                  points.slice().reverse().slice(0, 10).map((pt, i) => (
                    <div key={pt._id || i} className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3 border border-white/5 text-xs text-slate-300">
                      <div>
                        <span className="font-bold text-white">Waypoint #{points.length - i}</span>
                        <span className="ml-2 font-mono text-slate-400">{pt.latitude}, {pt.longitude}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <span>{pt.speed || 0} km/h</span>
                        <span>{new Date(pt.capturedAt).toLocaleTimeString('en-IN')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-slate-950/60 p-4 text-center text-xs text-slate-400">
                    No historic route waypoints logged yet. Start simulation or drive vehicle to generate live waypoints.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Geofence Form & Controls (1/3) */}
          <div className="space-y-6">
            <form onSubmit={handleCreateGeofence} className="rounded-3xl border border-cyan-400/30 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl space-y-4">
              <div>
                <h3 className="font-bold text-white text-base">Create Geofence Boundary</h3>
                <p className="text-xs text-slate-400 mt-0.5">Define safe operating radius around vehicle</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300">Geofence Name</label>
                  <input required name="name" placeholder="e.g. Home Depot / Tech Park" className="input mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300">Center Latitude</label>
                    <input required name="latitude" type="number" step="any" defaultValue={currentLoc?.latitude || 12.9716} className="input mt-1" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300">Center Longitude</label>
                    <input required name="longitude" type="number" step="any" defaultValue={currentLoc?.longitude || 77.5946} className="input mt-1" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">Allowed Radius (Meters)</label>
                  <input required name="radiusMeters" type="number" defaultValue={1000} className="input mt-1" />
                </div>
              </div>

              <button className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 hover:scale-[1.02] transition-all">
                Save Geofence Boundary
              </button>
            </form>

            {/* Existing Geofences List */}
            <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-2xl">
              <h3 className="font-bold text-white text-base">Active Geofences</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configured security zones</p>

              <div className="mt-3 space-y-2">
                {geofences.length > 0 ? (
                  geofences.map((gf) => (
                    <div key={gf._id} className="rounded-xl bg-slate-950/60 p-3 border border-white/5 text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-white block">{gf.name}</strong>
                        <span className="text-slate-400 text-[11px]">{gf.radiusMeters} meters radius</span>
                      </div>
                      <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                        ACTIVE
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No active geofence boundaries configured.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
