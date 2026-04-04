import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin, Grid, Map as MapIcon, Loader2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { monumentService, Monument, getRiskLevel } from '@/services/monumentService';
import MapView from '@/pages/MapView';
import { useAuth } from '@/context/AuthContext';

const riskGradient = {
  low: 'linear-gradient(90deg, #14532d, #16a34a)',
  medium: 'linear-gradient(90deg, #713f12, #ca8a04)',
  high: 'linear-gradient(90deg, #78350f, #d97706)',
  critical: 'linear-gradient(90deg, #7f1d1d, #dc2626)',
};

const riskBgColor: Record<string, string> = {
  low: 'bg-emerald-900/40 border-emerald-700 text-emerald-300',
  medium: 'bg-yellow-900/40 border-yellow-700 text-yellow-300',
  high: 'bg-amber-900/40 border-amber-700 text-amber-300',
  critical: 'bg-red-950/80 border-red-700 text-red-300',
};



const Monuments = () => {
  const { user, isAuthenticated } = useAuth();
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const [searchParams, setSearchParams] = useSearchParams();
  const isMapView = searchParams.get('view') === 'map';

  const fetchMonuments = () => {
    monumentService.getAll().then(data => {
      setMonuments(data.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMonuments();
  }, []);

  const types = ['all', ...Array.from(new Set(monuments.map(m => m.type).filter(Boolean)))];
  const risks = ['all', 'low', 'medium', 'high', 'critical'];

  const filtered = useMemo(() => {
    return monuments.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.city.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const mRisk = (m.risk_level ?? getRiskLevel(m.vulnerability_score)) as string;
      const matchRisk = riskFilter === 'all' || mRisk === riskFilter;
      return matchSearch && matchType && matchRisk;
    });
  }, [monuments, search, typeFilter, riskFilter]);

  return (
    <div className="min-h-screen bg-[#0a0806] pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-sand-light">Heritage Catalogue</h1>
            <p className="text-sand/55 mt-2 max-w-xl text-[13px] leading-relaxed">
              Discover Taroudant's historic ramparts and monuments, continually monitored for structural health.
            </p>
          </div>
          <div className="flex bg-[#1a1208] border border-sand/10 rounded-lg p-1 shrink-0">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('view');
                setSearchParams(params);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-xs font-mono tracking-wider ${!isMapView ? 'bg-copper-light text-charcoal shadow-sm' : 'text-sand/50 hover:text-sand'}`}
            >
              <Grid className="w-4 h-4" /> Grid
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('view', 'map');
                setSearchParams(params);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-xs font-mono tracking-wider ${isMapView ? 'bg-copper-light text-charcoal shadow-sm' : 'text-sand/50 hover:text-sand'}`}
            >
              <MapIcon className="w-4 h-4" /> Map
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 z-[20] relative">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand/30" />
            <Input
              placeholder="Search monuments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-[#1a1208] border-sand/10 text-sand placeholder:text-sand/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex items-center gap-1.5 text-xs text-sand/40 font-mono tracking-wider mr-1">
              <Filter className="h-3.5 w-3.5" /> TYPE:
            </div>
            {types.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t || 'all')}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase font-mono tracking-wider transition-colors border ${typeFilter === t ? 'bg-copper-light/20 text-copper-light border-copper-light/50' : 'bg-[#1a1208] text-sand/40 border-sand/10 hover:border-sand/30'}`}
              >
                {t === 'all' ? 'All' : String(t)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap items-center ml-0 sm:ml-4 border-l-0 sm:border-l border-sand/10 sm:pl-4">
            <div className="flex items-center gap-1.5 text-xs text-sand/40 font-mono tracking-wider mr-1">
              RISK:
            </div>
            {risks.map(r => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase font-mono tracking-wider transition-colors border ${riskFilter === r ? 'bg-copper-light/20 text-copper-light border-copper-light/50' : 'bg-[#1a1208] text-sand/40 border-sand/10 hover:border-sand/30'}`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-copper-light animate-spin mb-4" />
            <p className="text-sand/40 text-[10px] font-mono tracking-widest uppercase">Fetching Monuments...</p>
          </div>
        ) : (
          <>
            <div
              className="w-full rounded-xl border border-sand/10 overflow-hidden shadow-2xl shadow-black/80 z-[10] relative transition-all"
              style={{
                height: isMapView ? '600px' : '0px',
                display: isMapView ? 'block' : 'none',
              }}
            >
              <MapView embedded={true} />
            </div>

            {!isMapView && (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filtered.map((m, i) => {
                      const mRisk = (m.risk_level ?? getRiskLevel(m.vulnerability_score)) as 'low' | 'medium' | 'high' | 'critical';
                      const tone = riskBgColor[mRisk];
                      const gradient = riskGradient[mRisk];

                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Link to={`/monument/${m.id}`} className="block h-full bg-[#140e0a] border border-sand/10 rounded-xl overflow-hidden hover:-translate-y-1 hover:border-copper-light/30 transition-all duration-300 group shadow-lg shadow-black/20">
                            {/* Upper image area */}
                            <div className="h-44 bg-gradient-to-br from-stone-900 to-[#0a0806] relative overflow-hidden border-b border-sand/10">
                              {m.image_url ? (
                                <img src={m.image_url.startsWith('http') || m.image_url.startsWith('data:') ? m.image_url : `http://localhost:8000${m.image_url}`} alt={m.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-40 transition-opacity">
                                  <MapPin className="h-8 w-8 text-copper-light" />
                                </div>
                              )}
                              <div className="absolute top-3 right-3">
                                <div className={`px-2.5 py-1 rounded border text-[10px] font-mono tracking-wider uppercase ${tone}`}>
                                  {mRisk} Risk
                                </div>
                              </div>
                              <div className="absolute bottom-3 left-3">
                                <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider bg-black/60 backdrop-blur-md text-sand border border-sand/20">
                                  {m.type || 'Monument'}
                                </Badge>
                              </div>
                            </div>

                            {/* Lower text area */}
                            <div className="p-5 flex flex-col h-[calc(100%-11rem)]">
                              <h3 className="font-heading text-xl text-sand-light group-hover:text-copper-light transition-colors line-clamp-1">{m.name}</h3>
                              <p className="text-sand/40 text-[11px] uppercase tracking-wider font-mono mt-1.5">{m.city} · EST. {m.construction_year || 'Unknown'}</p>
                              <p className="text-sand/55 text-[13px] mt-3 line-clamp-2 leading-relaxed flex-1">{m.description || 'No description available for this monument.'}</p>

                              <div className="mt-4 pt-4 border-t border-sand/10">
                                {isAuthenticated && ['admin', 'inspector', 'authority'].includes(user?.role || '') ? (
                                  <>
                                    <div className="mb-1.5 flex items-center justify-between">
                                      <span className="text-[10px] font-mono tracking-wider text-sand/40 uppercase">Vulnerability</span>
                                      <span className="text-[11px] font-mono text-sand/60">{m.vulnerability_score || 0}/100</span>
                                    </div>
                                    <div className="h-1 w-full rounded-full bg-sand/10 overflow-hidden">
                                      <div className="h-1 rounded-full transition-all duration-1000" style={{ width: `${m.vulnerability_score || 0}%`, background: gradient }} />
                                    </div>
                                  </>
                                ) : (
                                  <div className="mb-1.5 flex items-center justify-between">
                                    <span className="text-[10px] font-mono tracking-wider text-sand/40 uppercase">Public Status</span>
                                    <span className="text-[11px] font-mono text-sand/60 px-2 py-0.5 rounded capitalize bg-sand/5">{m.status || 'Active'}</span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between mt-4 text-[10px] text-sand/30">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {m.last_inspection ? new Date(m.last_inspection).toLocaleDateString() : 'Never inspected'}
                                  </div>
                                  <span className="text-copper-light/60 group-hover:text-copper-light flex items-center gap-1 transition-colors">
                                    View Details &rarr;
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {filtered.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 px-4 border border-sand/5 rounded-xl bg-black/20">
                    <MapPin className="w-8 h-8 text-sand/20 mx-auto mb-3" />
                    <h3 className="text-sand-light font-heading text-lg mb-1">No monuments found</h3>
                    <p className="text-[13px] text-sand/40">Try adjusting your filters or search term to discover sites.</p>
                    <button
                      onClick={() => { setSearch(''); setTypeFilter('all'); setRiskFilter('all'); }}
                      className="mt-6 text-[11px] uppercase tracking-wider font-mono text-copper-light hover:underline"
                    >
                      Clear all filters
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Monuments;
