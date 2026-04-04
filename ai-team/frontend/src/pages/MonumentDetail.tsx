import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, MapPin, Loader2, Plus, Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { monumentService, Monument, getRiskLevel } from '@/services/monumentService';
import { apiFetch } from '@/services/authService';
import InspectionTimelineRow from '@/components/monuments/InspectionTimelineRow';
import CrackPhotoGallery from '@/components/monuments/CrackPhotoGallery';
import MonitoringHistorySummary from '@/components/monuments/MonitoringHistorySummary';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ─── Risk card ─────────────────────────────────────────────────────────────────

const riskGradient = {
  low: '#16a34a',
  medium: '#ca8a04',
  high: '#d97706',
  critical: '#dc2626',
};

const RiskCard = ({
  monument,
  inspectionCount,
}: {
  monument: Monument;
  inspectionCount: number;
}) => {
  const risk = monument.risk_level || 'low';
  const color = riskGradient[risk as keyof typeof riskGradient] || riskGradient.low;

  return (
    <div className="bg-[#140e0a] border border-sand/5 rounded-2xl p-6 shadow-xl flex flex-col gap-6 sm:min-w-[380px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-sand/30 mb-1">Current Risk Status</div>
          <div className={`text-2xl font-heading font-bold uppercase tracking-tight ${
            risk === 'critical' ? 'text-red-500' :
            risk === 'high' ? 'text-amber-500' :
            risk === 'medium' ? 'text-yellow-500' : 'text-emerald-500'
          }`}>
            {risk}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-sand/30 mb-0.5">Total Score</div>
          <div className="text-3xl font-heading text-sand-light">
            {monument.vulnerability_score}<span className="text-sm opacity-30">/100</span>
          </div>
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-sand/60 bg-white/5 p-4 rounded-lg italic border-l-2" style={{ borderLeftColor: color }}>
        "{monument.risk_summary}"
      </p>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] uppercase font-mono tracking-wider text-sand/40 mb-1.5">
            <span>Age Score</span>
            <span>Built in {monument.construction_year}, {monument.construction_year ? (2026 - monument.construction_year) : 'N/A'} years old</span>
          </div>
          <div className="h-1.5 w-full bg-sand/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${monument.age_score ?? 0}%` }}
              className="h-full bg-sand/40"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] uppercase font-mono tracking-wider text-sand/40 mb-1.5">
            <span>Crack Score</span>
            <span>{monument.crack_score ?? 0}/100</span>
          </div>
          <div className="h-1.5 w-full bg-sand/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${monument.crack_score ?? 0}%` }}
              className="h-full bg-copper-light/60"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <div className="text-[9px] uppercase font-mono tracking-widest text-sand/30 mb-0.5">Last Inspection</div>
          <div className={`text-xs font-medium ${!monument.last_inspection ? 'text-amber-500/80' : 'text-sand/80'}`}>
            {monument.last_inspection_display
              ?? (monument.last_inspection
                ? new Date(monument.last_inspection).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : null)
              ?? 'No inspection recorded yet'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase font-mono tracking-widest text-sand/30 mb-0.5">Inspection logs</div>
          <div className="text-xs text-sand/80 font-medium">
            {inspectionCount === 1 ? '1 entry' : `${inspectionCount} entries`}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

const MonumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  /* Role detection */
  const role = user?.role ?? 'public';
  const isPublic = !user;
  const isAuthority = role === 'authority' || role === 'admin';
  const isInspector = role === 'inspector';

  /* Data state */
  const [monument, setMonument] = useState<Monument | null>(null);
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* Photo gallery state (authority only) */
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCrackId, setGalleryCrackId] = useState<number | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  /* Fetch monument + inspection history */
  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const mon = await monumentService.getById(Number(id));
        if (!mon) {
          setError(true);
        } else {
          setMonument(mon);
          const hist = await monumentService.getInspectionHistory(Number(id), isPublic);
          setHistory(hist);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, isPublic]);

  /* Open photo gallery (authority) */
  const openPhotoGallery = useCallback(async (crackId: number) => {
    setGalleryCrackId(crackId);
    setGalleryOpen(true);
    setCurrentPhoto(0);
    setGalleryPhotos([]);
    try {
      const res = await apiFetch(`/api/cracks/${crackId}/photos`);
      const data = await res.json();
      setGalleryPhotos(data.results ?? []);
    } catch {
      setGalleryPhotos([]);
    }
  }, []);

  /* Download report PDF */
  const handleDownloadReport = useCallback(async (reportId: number) => {
    try {
      window.open(`${API_BASE}/api/reports/${reportId}/pdf`, '_blank');
    } catch {
      /* silent */
    }
  }, []);

  /* Gallery navigation */
  const handlePrevPhoto = () =>
    setCurrentPhoto(p => (p > 0 ? p - 1 : galleryPhotos.length - 1));
  const handleNextPhoto = () =>
    setCurrentPhoto(p => (p < galleryPhotos.length - 1 ? p + 1 : 0));

  /* ── Loading / Error states ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0806] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-copper-light animate-spin" />
      </div>
    );
  }

  if (error || !monument) {
    return (
      <div className="min-h-screen bg-[#0a0806] pt-20 flex items-center justify-center">
        <div className="text-center bg-[#140e0a] border border-sand/10 rounded-xl p-8 max-w-sm">
          <AlertTriangle className="h-10 w-10 text-sand/30 mx-auto mb-4" />
          <h1 className="font-heading text-xl text-sand-light mb-2">Monument Not Found</h1>
          <p className="text-sand/50 text-sm mb-6">
            The artifact or structural section you are looking for does not exist
            or has been removed from the registry.
          </p>
          <Link
            to="/monuments"
            className="inline-flex items-center text-sm uppercase tracking-wider font-mono text-copper-light hover:text-copper-light/80"
          >
            ← Back to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const inspections: any[] = history?.inspections ?? [];

  return (
    <div className="min-h-screen bg-[#0a0806] pt-24 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/monuments"
          className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-sand/40 hover:text-copper-light transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Catalogue
        </Link>

        {/* ── Monument header (untouched) ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12 border-b border-sand/10 pb-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-copper-light/10 text-copper-light border border-copper-light/20 text-[10px] uppercase font-mono tracking-widest hover:bg-copper-light/20">
                {monument.type || 'Monument'}
              </Badge>
              <span className="text-[10px] uppercase font-mono tracking-widest text-sand/30 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> {monument.city}
              </span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl text-sand-light leading-tight">
              {monument.name}
            </h1>
            <p className="text-sand/40 font-mono text-[11px] uppercase tracking-widest mt-4">
              EST. {monument.construction_year || 'Unknown'} · STATUS:{' '}
              <span className="text-sand/70">{monument.status}</span>
            </p>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={() =>
                  window.open(
                    `https://maps.google.com/?q=${monument.latitude},${monument.longitude}`,
                    '_blank'
                  )
                }
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-sand/10 px-4 py-2 rounded-lg text-[11px] uppercase tracking-wider font-mono text-sand/60 transition-all"
              >
                <MapPin className="w-3.5 h-3.5 text-copper-light" />
                Lat {monument.latitude?.toFixed(4)} · Lng {monument.longitude?.toFixed(4)}
              </button>
            </div>
          </div>

          <RiskCard monument={monument} inspectionCount={inspections.length} />
        </div>

        {/* ── Two-column grid ── */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 xl:gap-12">

          {/* Left Column: Structural Context (untouched) */}
          <div className="space-y-10">
            <div className="bg-[#140e0a] border border-sand/5 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-copper-light/5 rounded-bl-[100%] pointer-events-none" />
              <h2 className="font-heading text-2xl text-sand-light mb-6 flex items-center gap-3 relative z-10">
                <span className="w-6 h-px bg-copper-light/50" />
                Structural Context
              </h2>
              <div className="prose prose-sm prose-invert max-w-none text-sand/60 leading-relaxed text-[15px] relative z-10 mb-8">
                {monument.description ? (
                  <p>{monument.description}</p>
                ) : (
                  <p className="italic opacity-60">
                    No detailed structural history available for this artifact.
                  </p>
                )}
              </div>

              {/* WHY VULNERABLE BLOCK */}
              <div className="bg-white/5 border border-sand/10 rounded-xl p-5 mb-8 relative z-10">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-copper-light mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> Why It's Vulnerable
                </h4>
                <ul className="space-y-3">
                  {(monument.vulnerability_points || []).map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-[13px] text-sand/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-copper-light/40 mt-1.5 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-sand/5 relative z-10">
                {[
                  { label: 'City', val: monument.city },
                  { label: 'Location Profile', val: monument.location },
                  { label: 'Construction', val: monument.construction_year || 'Unknown' },
                  { label: 'Health Baseline', val: monument.risk_level },
                ].map(stat => (
                  <div key={stat.label}>
                    <span className="text-[9px] uppercase font-mono tracking-wider text-sand/30 block mb-1.5">
                      {stat.label}
                    </span>
                    <span className="text-sm text-sand-light truncate block" title={String(stat.val)}>
                      {stat.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Inspection section */}
          <div>

            {/* ═══════════════════════════════════════
                PUBLIC VIEW: Monitoring History Summary
                ═══════════════════════════════════════ */}
            {isPublic && (
              <MonitoringHistorySummary history={history} />
            )}

            {/* ═══════════════════════════════════════
                AUTHENTICATED VIEW: Compact Timeline
                ═══════════════════════════════════════ */}
            {isAuthenticated && (
              <section className="mt-0">

                {/* Timeline header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="font-heading text-2xl text-sand-light flex items-center gap-3">
                      <span className="w-6 h-px bg-copper-light/50" />
                      Inspection Log
                    </h2>
                    <span className="font-mono text-xs text-sand/35 bg-sand/5 border border-sand/10 rounded-full px-2.5 py-0.5">
                      {inspections.length}
                    </span>
                  </div>

                  {/* + button for inspectors only */}
                  {isInspector && (
                    <button
                      onClick={() => navigate(`/inspect/new?monument=${id}`)}
                      title="Log new inspection"
                      className="w-8 h-8 rounded-full border border-sand/15 flex items-center justify-center text-sand/40 hover:text-copper-light hover:border-copper-light/40 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Empty state */}
                {inspections.length === 0 ? (
                  <div className="bg-[#140e0a] border border-sand/5 border-dashed rounded-xl p-8 text-center flex flex-col items-center">
                    <Activity className="w-8 h-8 text-sand/20 mb-3" />
                    <p className="text-[13px] text-sand/40">No field inspections logged yet.</p>
                  </div>
                ) : (
                  /* Timeline */
                  <div className="relative">
                    {/* Vertical spine */}
                    <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gradient-to-b from-copper-light/30 via-sand/10 to-transparent" />

                    <div className="space-y-1 pl-8">
                      {inspections.map((insp: any, index: number) => (
                        <InspectionTimelineRow
                          key={insp.inspection_id}
                          inspection={insp}
                          isFirst={index === 0}
                          role={role}
                          onDownloadReport={handleDownloadReport}
                          onOpenPhotoGallery={isAuthority ? openPhotoGallery : undefined}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Inspector CTA — bottom */}
                {isInspector && inspections.length > 0 && (
                  <button
                    onClick={() => navigate(`/inspect/new?monument=${id}`)}
                    className="w-full py-3.5 mt-6 rounded-xl border border-dashed border-copper-light/30 text-copper-light/80 text-[11px] font-mono tracking-wider uppercase hover:border-copper-light hover:text-copper-light hover:bg-copper-light/5 transition-all text-center"
                  >
                    Log New Inspection →
                  </button>
                )}
              </section>
            )}

          </div>
        </div>
      </div>

      {/* ── Photo gallery modal (authority only) ── */}
      {isAuthority && (
        <CrackPhotoGallery
          open={galleryOpen}
          crackId={galleryCrackId}
          photos={galleryPhotos}
          currentIndex={currentPhoto}
          onClose={() => setGalleryOpen(false)}
          onPrev={handlePrevPhoto}
          onNext={handleNextPhoto}
        />
      )}
    </div>
  );
};

export default MonumentDetail;
