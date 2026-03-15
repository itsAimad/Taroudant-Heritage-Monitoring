import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, ZoomControl } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Menu } from 'lucide-react';
import { monumentService, Monument } from '@/services/monumentService';
import { createMonumentIcon } from '@/components/map/MonumentMarker';

const riskGradient = {
  low: 'linear-gradient(90deg, #14532d, #16a34a)',
  moderate: 'linear-gradient(90deg, #713f12, #ca8a04)',
  high: 'linear-gradient(90deg, #78350f, #d97706)',
  critical: 'linear-gradient(90deg, #7f1d1d, #dc2626)',
};
const riskTextColor = {
  low: 'text-emerald-400',
  moderate: 'text-yellow-400',
  high: 'text-amber-400',
  critical: 'text-red-400',
};
const riskCircleStyle = {
  low: 'border-emerald-700 text-emerald-400',
  moderate: 'border-yellow-700 text-yellow-400',
  high: 'border-amber-700 text-amber-400',
  critical: 'border-red-700 text-red-400',
};
const riskPillActive: Record<
  'all' | 'low' | 'moderate' | 'high' | 'critical',
  string
> = {
  all: 'border-sand/40 text-sand/80 bg-sand/10',
  low: 'border-emerald-700 text-emerald-400 bg-emerald-900/20',
  moderate: 'border-yellow-700 text-yellow-400  bg-yellow-900/20',
  high: 'border-amber-700  text-amber-400   bg-amber-900/20',
  critical: 'border-red-700   text-red-400     bg-red-900/20',
};

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

type RiskFilter = 'all' | 'low' | 'moderate' | 'high' | 'critical';

const MapView = () => {
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [selectedMonument, setSelectedMonument] = useState<Monument | null>(
    null,
  );
  const [filter, setFilter] = useState<RiskFilter>('all');
  const [search, setSearch] = useState('');
  const mapRef = useRef<LeafletMap | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    monumentService.getAll().then(setMonuments);
  }, []);

  const filteredMonuments = useMemo(
    () =>
      monuments
        .filter(
          (m) => filter === 'all' || m.riskLevel === filter,
        )
        .filter((m) => {
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          return (
            m.name.toLowerCase().includes(q) ||
            m.nameAr.includes(search)
          );
        }),
    [monuments, filter, search],
  );

  return (
    <div className={isMobile ? "flex flex-col h-[calc(100vh-64px)] bg-[#0f0d0b] relative overflow-hidden" : "flex h-[calc(100vh-64px)] bg-[#0f0d0b] overflow-hidden"}>

      {/* Drawer on Mobile */}
      <AnimatePresence>
        {isMobile && drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[1001]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-0 left-0 bottom-0 w-[85vw] max-w-[320px] z-[1002] bg-[#1a1208] border-r border-sand/8 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-sand/8">
                <div>
                  <h3 className="font-heading text-base text-sand-light">Monument Map</h3>
                  <p className="text-sand/35 text-xs mt-0.5">{monuments.length} sites monitored</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="text-sand/30 hover:text-sand/60 transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-sand/8">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                  {(['all', 'low', 'moderate', 'high', 'critical'] as RiskFilter[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setFilter(level)}
                      className={`shrink-0 text-[10px] tracking-wider uppercase rounded-full px-3 py-1.5 border transition-colors whitespace-nowrap ${filter === level ? riskPillActive[level] : 'border-sand/15 text-sand/40 hover:border-sand/30'
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sand/30 pointer-events-none" />
                  <input
                    placeholder="Search monuments..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-sand/5 border border-sand/10 rounded-md pl-9 pr-4 py-2 text-sand text-xs placeholder:text-sand/25 focus:outline-none focus:border-copper-light/30"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {filteredMonuments.map((mon) => (
                  <button
                    key={mon.id}
                    onClick={() => {
                      setSelectedMonument(mon);
                      setDrawerOpen(false);
                      if (mapRef.current) {
                        mapRef.current.setView(mon.coordinates, 17, { animate: true });
                      }
                    }}
                    className={`w-full text-left px-5 py-4 border-b border-sand/5 hover:bg-sand/5 transition-colors group ${selectedMonument?.id === mon.id ? 'bg-sand/8' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-sand group-hover:text-sand-light transition-colors">{mon.name}</p>
                        <p className="mt-0.5 text-[11px] text-sand/35">{mon.nameAr}</p>
                        <p className="mt-1 text-[10px] capitalize text-sand/30">{mon.type}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-mono font-medium ${riskCircleStyle[mon.riskLevel]}`}>
                          {mon.vulnerabilityScore}
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider ${riskTextColor[mon.riskLevel]}`}>
                          {mon.riskLevel}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 h-[2px] overflow-hidden rounded-full bg-sand/8">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${mon.vulnerabilityScore}%`, background: riskGradient[mon.riskLevel] }} />
                    </div>
                  </button>
                ))}
                {filteredMonuments.length === 0 && (
                  <p className="py-12 text-center text-xs text-sand/30">No monuments match your filter.</p>
                )}
              </div>

              <div className="p-4 border-t border-sand/8">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-sand/30">Risk Legend</p>
                {[
                  { level: 'critical', label: 'Critical (76–100)', color: '#dc2626' },
                  { level: 'high', label: 'High (51–75)', color: '#d97706' },
                  { level: 'moderate', label: 'Moderate (26–50)', color: '#ca8a04' },
                  { level: 'low', label: 'Low (0–25)', color: '#16a34a' },
                ].map((item) => (
                  <div key={item.level} className="mb-2 flex items-center gap-2.5">
                    <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-sand/45">{item.label}</span>
                  </div>
                ))}
                <p className="mt-3 text-[10px] text-sand/20">Numbers inside markers = vulnerability score</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar on Desktop */}
      {!isMobile && (
        <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-sand/8 bg-[#1a1208]">
          <div className="border-b border-sand/8 p-5">
            <h2 className="font-heading text-lg text-sand-light">Monument Map</h2>
            <p className="mt-1 text-xs text-sand/40">{monuments.length} sites under monitoring</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['all', 'low', 'moderate', 'high', 'critical'] as RiskFilter[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFilter(level)}
                  className={`rounded-full px-3 py-1 text-[10px] tracking-wider uppercase border transition-colors ${filter === level ? riskPillActive[level] : 'border-sand/15 text-sand/40 hover:border-sand/30'
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sand/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search monuments..."
                className="w-full rounded-md border border-sand/10 bg-sand/5 py-2 pl-9 pr-4 text-xs text-sand placeholder:text-sand/25 focus:outline-none focus:border-copper-light/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {filteredMonuments.map((mon) => (
              <button
                key={mon.id}
                type="button"
                onClick={() => {
                  setSelectedMonument(mon);
                  if (mapRef.current) {
                    mapRef.current.setView(mon.coordinates, 17, { animate: true });
                  }
                }}
                className={`group w-full border-b border-sand/5 px-5 py-4 text-left text-sm transition-colors hover:bg-sand/5 ${selectedMonument?.id === mon.id ? 'bg-sand/8' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-sand group-hover:text-sand-light transition-colors">{mon.name}</p>
                    <p className="mt-0.5 text-[11px] text-sand/35">{mon.nameAr}</p>
                    <p className="mt-1 text-[10px] capitalize text-sand/30">{mon.type}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-mono font-medium ${riskCircleStyle[mon.riskLevel]}`}>
                      {mon.vulnerabilityScore}
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider ${riskTextColor[mon.riskLevel]}`}>
                      {mon.riskLevel}
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 h-[2px] overflow-hidden rounded-full bg-sand/8">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${mon.vulnerabilityScore}%`, background: riskGradient[mon.riskLevel] }} />
                </div>
              </button>
            ))}
            {filteredMonuments.length === 0 && (
              <p className="py-12 text-center text-xs text-sand/30">No monuments match your filter.</p>
            )}
          </div>

          <div className="border-t border-sand/8 p-4">
            <p className="mb-3 text-[10px] uppercase tracking-wider text-sand/30">Risk Legend</p>
            {[
              { level: 'critical', label: 'Critical (76–100)', color: '#dc2626' },
              { level: 'high', label: 'High (51–75)', color: '#d97706' },
              { level: 'moderate', label: 'Moderate (26–50)', color: '#ca8a04' },
              { level: 'low', label: 'Low (0–25)', color: '#16a34a' },
            ].map((item) => (
              <div key={item.level} className="mb-2 flex items-center gap-2.5">
                <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: item.color }} />
                <span className="text-xs text-sand/45">{item.label}</span>
              </div>
            ))}
            <p className="mt-3 text-[10px] text-sand/20">Numbers inside markers = vulnerability score</p>
          </div>
        </div>
      )}

      {/* Map Content */}
      <div className={`relative flex-1 ${isMobile ? '' : 'mt-20'}`}>
        <MapContainer
          ref={mapRef}
          center={[30.4748, -8.872]}
          zoom={15}
          className="w-full h-full z-0"
          zoomControl={false}
          touchZoom={true}
          doubleClickZoom={true}
          scrollWheelZoom={!isMobile}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            maxZoom={19}
          />
          <ZoomControl position="bottomright" />

          {filteredMonuments.map((mon) => (
            <Marker
              key={mon.id}
              position={mon.coordinates}
              icon={createMonumentIcon(mon, isMobile)}
              eventHandlers={{ click: () => setSelectedMonument(mon) }}
            />
          ))}
        </MapContainer>

        {/* TOP BAR overlay on map (Mobile only) */}
        {isMobile && (
          <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 bg-[#1a1208]/90 backdrop-blur-md border border-sand/15 rounded-xl px-4 py-2.5 z-[1000]"
            >
              <Menu className="w-4 h-4 text-copper-light" />
              <span className="text-sand/70 text-xs font-mono tracking-wider">Monuments</span>
              <span className="bg-copper-light/20 text-copper-light text-[10px] rounded-full px-1.5 py-0.5 font-mono">
                {filteredMonuments.length}
              </span>
            </button>

            <div className="bg-[#1a1208]/90 backdrop-blur-md border border-sand/15 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sand/50 text-[10px] font-mono">LIVE</span>
            </div>
          </div>
        )}

        {/* Header overlay (Desktop only) */}
        {!isMobile && (
          <div className="absolute left-1/2 top-4 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full border border-sand/10 bg-[#1a1208]/80 px-5 py-2 shadow-md shadow-black/40 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs tracking-wider text-sand/60">
              LIVE MONITORING — TAROUDANT HERITAGE ZONE
            </span>
          </div>
        )}

        {/* Selected monument card (Mobile) */}
        <AnimatePresence>
          {isMobile && selectedMonument && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute bottom-0 left-0 right-0 z-[1000] bg-[#1a1208]/97 backdrop-blur-md border-t border-sand/10 rounded-t-2xl p-5 max-h-[55vh] overflow-y-auto"
            >
              <div className="w-10 h-1 rounded-full bg-sand/20 mx-auto mb-4" />
              <button
                type="button"
                onClick={() => setSelectedMonument(null)}
                className="absolute right-4 top-4 text-sand/30 transition-colors hover:text-sand/60"
              >
                <X className="h-5 w-5" />
              </button>

              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-copper-light/60">
                {selectedMonument.type}
              </span>
              <h3 className="pr-6 font-heading text-lg text-sand-light">{selectedMonument.name}</h3>
              <p className="mt-0.5 text-xs text-sand/35">{selectedMonument.nameAr}</p>

              <div className="mt-3 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-mono text-sm font-medium ${riskCircleStyle[selectedMonument.riskLevel]}`}>
                  {selectedMonument.vulnerabilityScore}
                </div>
                <div>
                  <p className={`text-sm font-medium capitalize ${riskTextColor[selectedMonument.riskLevel]}`}>
                    {selectedMonument.riskLevel} Risk
                  </p>
                  <p className="text-xs text-sand/35">Vulnerability Score</p>
                </div>
              </div>

              <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-sand/8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedMonument.vulnerabilityScore}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className="h-full rounded-full"
                  style={{ background: riskGradient[selectedMonument.riskLevel] }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Dynasty', value: selectedMonument.dynasty },
                  { label: 'Built', value: selectedMonument.builtCentury },
                  { label: 'Inspections', value: selectedMonument.inspectionCount },
                  { label: 'Active Cracks', value: selectedMonument.activeCracks },
                ].map((item) => (
                  <div key={item.label} className="rounded-md bg-sand/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-sand/35">{item.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-sand">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-sand/45">{selectedMonument.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-sand/25">
                <Clock className="h-3 w-3" />
                Last inspection: {relativeTime(selectedMonument.lastInspection)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected monument card (Desktop) */}
        <AnimatePresence>
          {!isMobile && selectedMonument && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-6 left-6 z-[1000] w-80 rounded-xl border border-sand/10 bg-[#1a1208]/95 p-5 shadow-2xl shadow-black/60 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setSelectedMonument(null)}
                className="absolute right-3 top-3 text-sand/30 transition-colors hover:text-sand/60"
              >
                <X className="h-4 w-4" />
              </button>

              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-copper-light/60">
                {selectedMonument.type}
              </span>
              <h3 className="pr-6 font-heading text-lg text-sand-light">{selectedMonument.name}</h3>
              <p className="mt-0.5 text-xs text-sand/35">{selectedMonument.nameAr}</p>

              <div className="mt-3 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-mono text-sm font-medium ${riskCircleStyle[selectedMonument.riskLevel]}`}>
                  {selectedMonument.vulnerabilityScore}
                </div>
                <div>
                  <p className={`text-sm font-medium capitalize ${riskTextColor[selectedMonument.riskLevel]}`}>
                    {selectedMonument.riskLevel} Risk
                  </p>
                  <p className="text-xs text-sand/35">Vulnerability Score</p>
                </div>
              </div>

              <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-sand/8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedMonument.vulnerabilityScore}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className="h-full rounded-full"
                  style={{ background: riskGradient[selectedMonument.riskLevel] }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Dynasty', value: selectedMonument.dynasty },
                  { label: 'Built', value: selectedMonument.builtCentury },
                  { label: 'Inspections', value: selectedMonument.inspectionCount },
                  { label: 'Active Cracks', value: selectedMonument.activeCracks },
                ].map((item) => (
                  <div key={item.label} className="rounded-md bg-sand/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-sand/35">{item.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-sand">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-sand/45">{selectedMonument.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-sand/25">
                <Clock className="h-3 w-3" />
                Last inspection: {relativeTime(selectedMonument.lastInspection)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MapView;


