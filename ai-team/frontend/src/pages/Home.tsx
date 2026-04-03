import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Calendar,
  Lock,
  AlertTriangle,
  ChevronRight,
  Clock,
  MapPin,
  BarChart2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import RampartScene from '@/components/3D/RampartScene';
import RequestAccessModal from '@/components/ui/RequestAccessModal';
import { monumentService, Monument } from '@/services/monumentService';
import MapView from '@/pages/MapView';

const sectionVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay },
  }),
};

const indexVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, delay: 0.2 },
  },
};

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [monuments, setMonuments] = useState<Monument[]>([]);



  useEffect(() => {
    const fetchMonuments = async () => {
      const data: any = await monumentService.getAll();
      setMonuments(data.results);
    }
    fetchMonuments();
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const getBadgeStyles = (tone: string) => {
    switch (tone) {
      case 'emerald':
        return 'bg-emerald-900/50 text-emerald-300 border-emerald-700/60';
      case 'red':
        return 'bg-red-900/60 text-red-300 border-red-700/60';
      case 'red-strong':
        return 'bg-red-950/80 text-red-300 border-red-700/60';
      case 'amber':
      default:
        return 'bg-amber-900/50 text-amber-200 border-amber-700/60';
    }
  };



  return (
    <div className="relative min-h-screen bg-charcoal text-sand overflow-x-hidden">
      {/* Scrollable content */}
      <main className="relative z-10 flex flex-col">
        {/* SECTION 1 — HERO */}
        <section className="relative flex min-h-screen flex-col justify-between pb-10 pt-20 md:pt-24 overflow-hidden">
          {/* 3D hero background scoped to hero section */}
          <div className="absolute inset-0 -z-10">
            <RampartScene />
            {/* Gradient overlays for depth */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal/40 via-transparent to-charcoal/90" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-charcoal/65 via-transparent to-charcoal/60" />
          </div>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={sectionVariant}
              className="max-w-2xl text-left ml-0 md:ml-[8vw]"
            >
              <div className="mb-8 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="inline-block h-px w-16 bg-copper-light" />
                  <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-copper-light/70">
                    EST. ~300 BCE
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="h-7 w-7 text-copper-light/80" />
                  <span className="font-mono text-[11px] tracking-[0.35em] uppercase text-sand/40">
                    Heritage Monitoring System
                  </span>
                </div>

                <h1 className="font-heading text-[clamp(3rem,8vw,4.5rem)] leading-[1.05]">
                  <span className="block text-sand/60 font-light">Guardians of</span>
                  <span className="block text-sand-light font-semibold">Taroudant</span>
                  <span className="block text-copper-light italic">Heritage</span>
                </h1>

                <div className="w-48 border-b border-copper-light/20 pt-4" />

                <p className="max-w-md text-sm text-sand/65 leading-relaxed">
                  Taroudant&apos;s ramparts stand as one of Morocco&apos;s most complete medieval fortifications —
                  7.5 kilometers of pisé earthen walls, 5 monumental gates, and over 130 towers, some dating to the
                  11th century Almoravid dynasty. This system monitors their structural integrity in real time.
                </p>
              </div>

              {/* System state pills */}
              <div className="mb-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-sand/15 bg-sand/5 px-4 py-1.5 text-[11px] text-sand/60">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="uppercase tracking-[0.2em]">System Active</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-sand/15 bg-sand/5 px-4 py-1.5 text-[11px] text-sand/60">
                  <Clock className="h-3.5 w-3.5 text-sand/40" />
                  <span className="uppercase tracking-[0.18em]">Last inspection: 2 days ago</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to={isAuthenticated ? '/dashboard' : '/login'}
                  className="group inline-flex items-center gap-2 rounded-full bg-copper-light px-7 py-2.5 text-sm font-medium text-charcoal hover:bg-copper-light/90 transition-colors"
                >
                  {isAuthenticated ? 'Enter Dashboard' : 'Enter System'}
                  <ChevronRight className="chevronRh-4 w-4 transition-transform duration-300 group-hover:translate-x-[6px]" />
                </Link>
                <Link
                  to="/heritage"
                  className="inline-flex items-center gap-2 rounded-full border border-copper-light/40 bg-transparent px-7 py-2.5 text-sm font-medium text-copper-light hover:bg-copper-light/10 transition-colors"
                >
                  Explore Heritage
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center text-[11px] font-medium tracking-[0.22em] uppercase text-sand/35 hover:text-sand/60 transition-colors"
                >
                  Continue as Guest
                  <span className="ml-1 text-sand/45">→</span>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Data ribbon & scroll indicator */}
          <div className="relative mt-12 border-t border-copper-light/10 bg-charcoal/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-stretch justify-between px-6 py-4 md:py-5">
              {/* Stats ribbon */}
              <div className="flex flex-1 flex-wrap items-stretch justify-between gap-4 text-xs md:text-[11px]">
                {[
                  { value: '7.5 km', label: 'Rampart perimeter' },
                  { value: '130+', label: 'Defensive towers' },
                  { value: '5', label: 'Historic gates (babs)' },
                  { value: '11th c', label: 'Oldest documented sections' },
                  { value: 'UNESCO', label: 'Tentative list candidate' },
                ].map((stat, idx) => (
                  <div
                    key={stat.label}
                    className="group flex min-w-[120px] flex-1 items-center justify-center px-2 "
                  >
                    <div className="flex flex-col items-center text-center transition-transform duration-200 group-hover:-translate-y-0.5">
                      <div className="font-heading text-xl md:text-2xl text-copper-light">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-sand/40">
                        {stat.label}
                      </div>
                    </div>
                    {idx < 4 && (
                      <div className="hidden h-8 w-px bg-gradient-to-b from-sand/20 via-sand/10 to-transparent md:block ml-4" />
                    )}
                  </div>
                ))}
              </div>

              {/* Scroll indicator */}
              <div className="hidden md:flex items-center pl-6">
                <div className="flex items-center gap-3">
                  <motion.span
                    className="-rotate-90 font-mono text-[10px] uppercase tracking-[0.3em] text-sand/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    scroll
                  </motion.span>
                  <div className="relative flex h-16 w-px items-start justify-start overflow-hidden">
                    <div className="h-full w-px bg-gradient-to-b from-copper-light/60 to-transparent" />
                    <motion.div
                      className="absolute top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-copper-light"
                      animate={{ y: [0, 48, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — THE CITY */}
        <section className="relative bg-[#0f0d0b] py-24 md:py-32">
          <motion.div
            className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 md:flex-row"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={sectionVariant}
            custom={0}
          >
            {/* Left column */}
            <div className="md:sticky md:top-24 md:w-5/12 space-y-6">
              <motion.div variants={indexVariant}>
                <div className="font-mono text-[11px] text-copper-light/40">01 / 05</div>
              </motion.div>
              <div className="tracking-[0.3em] uppercase text-copper-light text-sm">
                The City
              </div>
              <h2 className="font-heading text-2xl md:text-4xl text-sand-light leading-tight">
                Two Millennia of Civilization Above the Souss Plain
              </h2>

              <div className="space-y-4 text-[13px] leading-[1.9] text-sand/60">
                <p>
                  Founded as a Berber settlement and later fortified during the Almoravid dynasty
                  in the 11th century, Taroudant grew into the capital of the Sous region under the
                  Saadian dynasty (16th century), when it served as the first royal capital beforeW
                  Marrakech.
                </p>
                <p>
                  The city&apos;s defensive architecture reflects centuries of political strategy —
                  the ramparts were expanded, repaired, and reinforced by successive dynasties, each
                  leaving architectural fingerprints in the pisé (rammed earth) construction method
                  still visible today.
                </p>
                <p>
                  Today Taroudant is considered one of the best-preserved medieval medinas in
                  Morocco, a living city where <u>95,903</u> <i>Approximately</i> of The city's population coexist with structures that predate
                  the European Renaissance.
                  <br />
                  <br />
                  <i>Source: <a href="https://globalpopulations.com/ma/1393232-taroudant/" target="_blank" rel="noopener noreferrer" className="text-copper-light">GlobalPopulations</a></i>
                </p>
              </div>

              <div className="my-6 border-l-2 border-copper-light pl-4 text-[13px] text-sand/70">
                <p className="italic">
                  &quot;The walls of Taroudant are not ruins — they are a living boundary between
                  centuries.&quot;
                </p>
                <p className="mt-2 text-[11px] text-sand/40">
                  — Regional Heritage Commission, 2021
                </p>
              </div>
            </div>

            {/* Right column — image mosaic */}
            <div className="md:w-7/12 space-y-10">
              <div className="grid gap-4 md:gap-5">
                {/* Top wide */}
                <div className="group overflow-hidden rounded-sm border border-sand/5 bg-stone-800/60">

                  <div className="px-2 py-2 text-[11px] italic text-sand/30">
                    <span className='text-sand/30'>
                      <img src="/assets/kesbah_gate.png" alt="Bab El Kesbah" className=" fit-cover object-cover object-center  rounded-sm " />
                    </span>
                    <br />
                    Northern curtain wall, afternoon light over the Souss plain
                  </div>
                </div>

                {/* Middle row */}
                <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                  <div className="group overflow-hidden rounded-sm border border-sand/5 bg-stone-800/60">
                    <div className="relative aspect-square">
                      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/40 via-transparent to-stone-700/40" />
                      <div className="flex h-full w-full items-center justify-center items-center px-1 text-center">
                        <span className="text-[11px] text-sand/30">
                          {/* Bab Zorgane gate, eastern entrance */}
                          <img src="/assets/bab_zourgane.png" alt="Zargane Gate, eastern entrance" className="w-[360px] h-[280px] fit-cover object-cover object-center  rounded-sm " />

                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-2 text-[11px] italic text-sand/30">
                      Fortified gate overlooking the palm groves and approach roads
                    </div>
                  </div>

                  <div className="group overflow-hidden rounded-sm border border-sand/5 bg-stone-800/60">
                    <div className="relative aspect-square">
                      <div className="absolute inset-0 bg-gradient-to-tr from-stone-900/40 via-transparent to-stone-700/40" />
                      <div className="flex h-full w-full items-center justify-center px-4 text-center">
                        <span className="text-[11px] text-sand/30">
                          Pisé earthen wall texture detail, Section 4
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-2 text-[11px] italic text-sand/30">
                      Rammed-earth construction with visible repair strata
                    </div>
                  </div>
                </div>

                {/* Bottom wide */}
                <div className="group overflow-hidden rounded-sm border border-sand/5 bg-stone-800/60">
                  <div className="relative aspect-[16/7]">
                    <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900/70" />
                    <div className="flex h-full w-full items-center justify-center px-4 text-center">
                      <span className="text-[11px] text-sand/30">
                        Aerial view, Taroudant medina from the south
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-2 text-[11px] italic text-sand/30">
                    Medina fabric and rampart geometry at the edge of the Souss valley
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-10">
                <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-sand/40">
                  Key Historical Periods
                </div>
                <div className="relative overflow-x-auto pb-4">
                  <div className="relative min-w-[560px]">
                    <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-sand/20" />
                    <div className="relative flex justify-between">
                      {[
                        {
                          date: '~300 ق.م',
                          label: 'Berber settlement, pre-Islamic period',
                        },
                        {
                          date: '448-449 م',
                          label: 'Almoravid fortification of the medina',
                        },
                        {
                          date: '926-927 م',
                          label: 'Saadian capital, major wall expansion',
                        },
                        {
                          date: '1098-1099 م',
                          label: 'Alaouite restoration of the northern gates',
                        },
                        {
                          date: '1440-1441 م',
                          label: 'UNESCO tentative world heritage nomination',
                        }

                      ].map((node, idx) => (
                        <div key={node.date} className="relative flex w-[18%] flex-col items-center">
                          <div
                            className={`mb-3 font-mono text-[11px] text-copper-light ${idx % 2 === 0 ? 'order-1' : 'order-3 mt-6'
                              }`}
                          >
                            {node.date}
                          </div>
                          <div className="order-2 flex h-8 items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-copper-light shadow-[0_0_0_3px_rgba(201,163,117,0.2)]" />
                          </div>
                          <div
                            className={`mt-2 text-[11px] text-sand/40 ${idx % 2 === 0 ? 'order-3 mt-4' : 'order-1 mb-4'
                              }`}
                          >
                            {node.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* SECTION 3 — MONUMENTS CATALOGUE PREVIEW */}
        <section className="bg-[#0c0a08] py-24 md:py-28">
          <motion.div
            className="mx-auto w-full max-w-6xl px-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={sectionVariant}
            custom={0}
          >
            <div className="mb-8 space-y-3 text-left">
              <motion.div variants={indexVariant}>
                <div className="font-mono text-[11px] text-copper-light/40">02 / 05</div>
              </motion.div>
              <h2 className="font-heading text-2xl md:text-3xl text-sand-light">
                Monuments Under Watch
              </h2>
              <p className="max-w-xl text-[13px] text-sand/55 leading-relaxed">
                Each structure is assigned a vulnerability score updated after every inspection,
                reflecting its age, observed damage, and inspection frequency.
              </p>
            </div>

            <div className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pl-2 pr-4 md:-mx-4 md:pl-4 md:pr-6 monuments-scroll">
              {/* calling fetchAllMonuments function */}
              {monuments.map((m, idx) => (
                <motion.article
                  key={m.name}
                  className="snap-center shrink-0 w-80 rounded-lg border border-sand/8 bg-stone-900/80 overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.7, delay: idx * 0.1 }}
                >
                  <div className="relative h-48 bg-stone-800/70">
                    <div className="absolute h-[211px] inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Risk badge */}
                    <div className="absolute left-3 top-3">
                      <div
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase ${getBadgeStyles(
                          m.risk_level,
                        )}`}
                      >
                        {m.risk_level} RISK
                      </div>
                    </div>

                    {/* Monument name */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="font-heading text-lg font-medium text-sand-light">
                        {m.name}
                      </div>
                    </div>

                    {/* Placeholder text */}
                    <div className="flex h-full w-full items-center justify-center">

                      {monumentService.getMonumentPhotoUrl(m.id) ? (

                        < img className="w-full h-full object-cover" src={monumentService.getMonumentPhotoUrl(m.id)} alt={m.name} />
                      ) : (
                        <img className="w-full h-full object-cover" src="/placeholder.jpg" alt={m.name} />
                      )}

                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-copper-light/60">
                      {m.type}
                    </div>
                    <p className="mt-4 text-xs leading-relaxed text-sand/60 line-clamp-3">{m.description}</p>

                    <div className="mt-6">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-mono tracking-wider text-sand/40 uppercase">
                          Vulnerability
                        </span>
                        <span className="text-[11px] font-mono text-sand/60">
                          {m.vulnerability_score}/100
                        </span>
                      </div>
                      <div
                        className="relative h-[3px] w-full rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <motion.div
                          className="absolute left-0 top-0 h-full rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${m.vulnerability_score}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 1,
                            delay: idx * 0.1,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          style={{
                            background:
                              m.vulnerability_score >= 76
                                ? 'linear-gradient(90deg, #7f1d1d, #dc2626)'
                                : m.vulnerability_score >= 51
                                  ? 'linear-gradient(90deg, #78350f, #d97706)'
                                  : m.vulnerability_score >= 26
                                    ? 'linear-gradient(90deg, #713f12, #ca8a04)'
                                    : 'linear-gradient(90deg, #14532d, #16a34a)',
                            boxShadow:
                              m.vulnerability_score >= 76
                                ? '0 0 8px rgba(220,38,38,0.4)'
                                : m.vulnerability_score >= 51
                                  ? '0 0 8px rgba(217,119,6,0.4)'
                                  : m.vulnerability_score >= 26
                                    ? '0 0 8px rgba(202,138,4,0.3)'
                                    : '0 0 8px rgba(22,163,74,0.3)',
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2 text-[11px] text-sand/30">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Last inspection: {m.last_inspection}</span>
                    </div>

                    <div className="mt-5 border-t border-sand/5 pt-4">
                      <Link
                        to={`/monument/${m.id}`}
                        className="group/btn inline-flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-widest text-sand/40 transition-colors hover:text-copper-light"
                      >
                        <span>View Full Details</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Link
                to="/monuments"
                className="inline-flex items-center gap-1 text-sm text-copper-light hover:underline"
              >
                View full catalogue
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* SECTION 4 — HOW THE SYSTEM WORKS */}
        <section className="bg-[#0f0d0b] py-28 md:py-32">
          <motion.div
            className="mx-auto w-full max-w-5xl px-6 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={sectionVariant}
            custom={0}
          >
            <motion.div variants={indexVariant}>
              <div className="mb-3 font-mono text-[11px] text-copper-light/40">03 / 05</div>
            </motion.div>
            <h2 className="font-heading text-2xl md:text-3xl text-sand-light">
              The Monitoring Pipeline
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[13px] text-sand/55 leading-relaxed">
              A closed-loop system connecting field inspectors, structural analysis, and heritage
              authorities.
            </p>
          </motion.div>

          <div className="mx-auto mt-14 flex w-full max-w-5xl flex-col gap-12 px-6">
            {/* Step 1 */}
            <motion.div
              className="relative max-w-3xl mr-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={sectionVariant}
              custom={0.1}
            >
              <div className="pointer-events-none absolute -top-10 -left-4 select-none font-heading text-[6rem] text-copper-light/8 md:text-[8rem] pt-5 sm:pt-3">
                01
              </div>
              <div className="relative space-y-4 rounded-lg bg-black/10 p-5 md:p-6">
                <div className="text-sm uppercase tracking-[0.22em] text-copper-light">
                  Field Inspection
                </div>
                <h3 className="font-heading text-lg md:text-xl text-sand-light pt-12 md:pt-16">
                  Inspectors log cracks, erosion, and structural anomalies on-site
                </h3>
                <p className="text-[13px] leading-relaxed text-sand/60 ">
                  Trained heritage inspectors visit assigned monuments on a rotating schedule. Using
                  the mobile interface, they photograph damage, classify crack severity (minor /
                  moderate / major / critical), and submit georeferenced reports.
                </p>

                {/* Mock inspection UI */}
                <div className="mt-4 rounded-lg border border-sand/10 bg-charcoal/70 p-4 text-left text-[11px] text-sand/70">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand/40">
                      Inspection Form (Static Mock)
                    </span>
                    <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] text-emerald-300">
                      Draft · Offline-safe
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-sand/35">
                        Monument
                      </div>
                      <div className="rounded border border-sand/15 bg-black/20 px-2.5 py-1.5">
                        Bab Zorgane — East Gate
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-sand/35">
                        Date
                      </div>
                      <div className="flex items-center gap-2 rounded border border-sand/15 bg-black/20 px-2.5 py-1.5">
                        <Calendar className="h-3.5 w-3.5 text-sand/35" />
                        <span>2025-02-06 · 16:42</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-sand/35">
                        Crack Type
                      </div>
                      <div className="rounded border border-sand/15 bg-black/20 px-2.5 py-1.5">
                        Vertical · Step Cracking
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-sand/35">
                        Severity
                      </div>
                      <div className="flex items-center justify-between rounded border border-sand/15 bg-black/20 px-2.5 py-1.5">
                        <span>Medium</span>
                        <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] text-amber-300">
                          3 pts
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-sand/35">
                      Photo Upload
                    </div>
                    <div className="flex h-14 items-center justify-center rounded border border-dashed border-sand/20 bg-black/20 text-[10px] text-sand/35">
                      Tap to attach elevation photo · JPEG / HEIC · Max 15 MB
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Connector */}
            <div className="ml-[10%] h-16 border-l border-dashed border-copper-light/15" />

            {/* Step 2 */}
            <motion.div
              className="relative max-w-3xl ml-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={sectionVariant}
              custom={0.25}
            >
              <div className="relative space-y-4 rounded-lg bg-black/10 p-5 md:p-6">
                {/* <div className="pointer-events-none absolute -top-10 -left-4 select-none font-heading text-[6rem] text-copper-light/8 md:text-[8rem] pt-5 sm:pt-3"> */}
                <div className="pointer-events-none absolute -left-[3px] -top-[16px] select-none font-heading text-[7rem] text-copper-light md:text-[8rem]">
                  02
                </div>
                <div className="text-sm uppercase tracking-[0.22em] text-copper-light">
                  Automated Scoring
                </div>
                <h3 className="font-heading text-lg md:text-xl text-sand-light pt-12 md:pt-16">
                  A vulnerability algorithm weighs age, crack severity, and frequency
                </h3>
                <p className="text-[13px] leading-relaxed text-sand/60">
                  The <span className="font-mono text-[12px]">CalculateVulnerabilityScore</span>{' '}
                  procedure runs automatically after each inspection. It factors in the monument&apos;s
                  construction age, cumulative crack severity weights (minor=1, moderate=3, major=7,
                  critical=15), and inspection frequency to produce a score from 0–100.
                </p>

                {/* Score breakdown widget */}
                <div className="mt-4 rounded-lg border border-sand/10 bg-charcoal/70 p-4 text-left text-[11px] text-sand/70">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand/40">
                      Vulnerability Breakdown (Example)
                    </span>
                    <span className="rounded-full bg-red-900/50 px-2 py-0.5 text-[10px] text-red-200">
                      Total Score: 68 / 100
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Age Factor (pre-16th c.)', value: 24, tone: 'bg-amber-400' },
                      { label: 'Crack Severity Accumulated', value: 32, tone: 'bg-red-400' },
                      { label: 'Inspection Frequency (recent)', value: 12, tone: 'bg-emerald-400' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex items-center justify-between">
                          <span>{item.label}</span>
                          <span className="font-mono text-sand/70">{item.value}</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-sand/10">
                          <div
                            className={`h-1 rounded-full ${item.tone}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-sand/40">
                    <span>Risk band: High (51–75)</span>
                    <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-amber-300">
                      Alert recommended
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Connector */}
            <div className="ml-[10%] h-16 border-l border-dashed border-copper-light/15" />

            {/* Step 3 */}
            <motion.div
              className="relative max-w-3xl mr-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={sectionVariant}
              custom={0.4}
            >
              <div className="relative space-y-4 rounded-lg bg-black/10 p-5 md:p-6">
                <div className="pointer-events-none absolute -left-[3px] -top-[16px] select-none font-heading text-[7rem] text-copper md:text-[8rem]">
                  03
                </div>
                <div className="text-sm uppercase tracking-[0.22em] text-copper-light">
                  Authority Alerts
                </div>
                <h3 className="font-heading text-lg md:text-xl text-sand-light  pt-20 md:pt-17">
                  Critical scores trigger instant notifications to heritage authorities
                </h3>
                <p className="text-[13px] leading-relaxed text-sand/60">
                  When a monument scores above 75 (Critical) or 51 (High), the system automatically
                  dispatches encrypted notifications to regional heritage authority accounts —
                  ensuring zero delay between discovery and response.
                </p>

                {/* Notification bubble */}
                <div className="mt-4 rounded-lg border border-red-800/60 bg-red-950/40 p-4 text-left text-[11px] text-sand/80">
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-mono uppercase tracking-[0.18em]">
                      CRITICAL ALERT — PUSHED TO AUTHORITIES
                    </span>
                  </div>
                  <div className="text-[12px] font-semibold text-sand-light">
                    Northeast Tower Cluster — Score: 84 (Critical)
                  </div>
                  <p className="mt-1 text-[11px] text-sand/70">
                    Immediate review required. Structural cracks exceeding threshold detected on
                    towers 3, 4, and 6. Recommended: on-site inspection within 48 hours.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-sand/40">
                    <span className="rounded-full bg-black/40 px-2 py-0.5">
                      Channel: Encrypted mobile &amp; email
                    </span>
                    <span className="rounded-full bg-black/40 px-2 py-0.5">
                      Recipients: Regional Heritage Authority — Souss Massa
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Connector */}
            <div className="ml-[10%] h-16 border-l border-dashed border-copper-light/15" />

            {/* Step 4 */}
            <motion.div
              className="relative max-w-3xl ml-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={sectionVariant}
              custom={0.55}
            >
              <div className="relative space-y-4 rounded-lg bg-black/10 p-5 md:p-6">
                <div className="pointer-events-none absolute -left-[3px] -top-[16px] select-none font-heading text-[7rem] text-[#553c26] md:text-[8rem]">
                  04
                </div>
                <div className="text-sm uppercase tracking-[0.22em] text-copper-light">
                  Encrypted Reports
                </div>
                <h3 className="font-heading text-lg md:text-xl text-sand-light pt-20 md:pt-20">
                  Inspection reports are archived with AES encryption and full audit trails
                </h3>
                <p className="text-[13px] leading-relaxed text-sand/60">
                  Every generated report is AES-encrypted at rest in the database. Access is
                  role-controlled: inspectors see their own reports, authorities see all monuments in
                  their jurisdiction, and every access event is logged in an immutable audit table.
                </p>

                {/* Encrypted report card */}
                <div className="mt-4 rounded-lg border border-sand/12 bg-charcoal/75 p-4 text-left text-[11px] text-sand/70">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-copper-light/10">
                        <Lock className="h-3.5 w-3.5 text-copper-light" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-sand-light">
                          Report #AGH-2025-02-06-03
                        </div>
                        <div className="text-[10px] text-sand/40">
                          Bab Aghbalou — Crack survey · AES-256-GCM
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] text-emerald-300">
                      ENCRYPTED
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-sand/35">
                        Role Access
                      </div>
                      <div className="text-[11px] text-sand/70">
                        Inspectors (own), Regional Authorities, System Admin (read-only)
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-sand/35">
                        Last Access
                      </div>
                      <div className="text-[11px] text-sand/70">
                        2025-02-07 09:18 · Regional Heritage Authority
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-sand/35">
                        Audit Trail
                      </div>
                      <div className="text-[11px] text-sand/70">
                        6 reads · 0 edits · 0 deletions (immutable ledger)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 4 — SEE IT IN ACTION */}
        <section className="relative py-16 sm:py-32 bg-[#0c0a08] overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(180,120,60,0.06) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative max-w-2xl mx-auto text-center px-6 mb-16">
            <span className="font-mono text-xs tracking-[0.4em] text-copper-light/40">
              04 / 05
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
              className="font-heading text-sand-light leading-tight mt-3">
              See It In Action
            </h2>
            <p className="text-sand/50 text-sm sm:text-base leading-relaxed mt-4 max-w-xl mx-auto">
              A live walkthrough of the heritage monitoring dashboard —
              from field inspection logging to encrypted report generation
              and real-time vulnerability scoring.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px w-12 bg-copper-light/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-copper-light/40" />
              <div className="h-px w-12 bg-copper-light/20" />
            </div>
          </div>

          <div className="relative max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-8">
            <div className="absolute inset-x-0 top-1/4 h-1/2 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(180,120,60,0.08), transparent)',
              }}
            />

            <div className="relative w-full" style={{ perspective: '1200px' }}>
              <motion.div
                initial={isMobile ? { opacity: 0, y: 30 } : { opacity: 0, rotateX: 6, y: 40 }}
                whileInView={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, rotateX: 0, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="relative w-full rounded-t-2xl overflow-hidden pt-[2%] sm:pt-[1.4%] px-[2%] sm:px-[1.4%]"
                  style={{
                    background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 40%, #111 100%)',
                    boxShadow: '0 0 0 1.5px #3a3a3a, 0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(180,120,60,0.06)',
                  }}>

                  <div className="flex items-center gap-2 px-3 pt-2 pb-2.5"
                    style={{ background: '#1c1c1e', borderRadius: '10px 10px 0 0' }}>

                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition cursor-pointer" style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.3)' }} />
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 transition cursor-pointer" style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.3)' }} />
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28c840] hover:brightness-110 transition cursor-pointer" style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.3)' }} />
                    </div>

                    <div className="flex-1 mx-3 hidden sm:flex">
                      <div className="mx-auto max-w-xs bg-[#2c2c2e] rounded-md px-3 py-1 flex items-center gap-2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(235,220,185,0.3)" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span className="truncate" style={{ fontSize: '10px', color: 'rgba(235,220,185,0.35)', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                          heritage.taroudant.ma/dashboard
                        </span>
                      </div>
                    </div>

                    <div className="w-[54px] hidden sm:block" />
                  </div>

                  <div className="relative w-full overflow-hidden" style={{ background: '#0f0d0b', aspectRatio: '16/9' }}>
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ display: 'block' }}
                    >
                      <source src="/assets/analytics.mp4" type="video/mp4" />

                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0d0b]">
                        <div className="w-16 h-16 rounded-full border border-sand/15 flex items-center justify-center mb-4">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(180,120,60,0.6)">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>
                        <p style={{ color: 'rgba(235,220,185,0.2)', fontSize: '12px', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                          VIDEO PLACEHOLDER
                        </p>
                        <p style={{ color: 'rgba(235,220,185,0.1)', fontSize: '10px', marginTop: '6px', fontFamily: 'monospace' }}>
                          /public/videos/dashboard-demo.mp4
                        </p>
                      </div>
                    </video>

                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.015) 0%, transparent 50%)' }} />
                  </div>
                </div>

                <div className="relative w-full h-3 sm:h-4" style={{ background: 'linear-gradient(180deg, #2a2a2a 0%, #222 50%, #1a1a1a 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', borderRadius: '0 0 2px 2px' }}>
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 sm:w-24 h-full rounded-b-sm" style={{ background: 'rgba(0,0,0,0.25)' }} />
                </div>

                <div className="relative mx-auto h-[6px] sm:h-[10px]" style={{ width: '110%', marginLeft: '-5%', background: 'linear-gradient(180deg, #1f1f1f 0%, #161616 100%)', borderRadius: '0 0 8px 8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
              </motion.div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
              {[
                { icon: Shield, text: 'Role-based access control' },
                { icon: BarChart2, text: 'Real-time vulnerability scoring' },
                { icon: Lock, text: 'AES-encrypted reports' },
              ].map((chip) => (
                <div key={chip.text} className="flex items-center gap-2 bg-sand/5 border border-sand/10 rounded-full px-4 py-2">
                  <chip.icon className="w-3.5 h-3.5 text-copper-light/60" />
                  <span className="text-sand/50 text-xs">{chip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NEW SECTION — LIVE MONITORING MAP */}
        <section className="relative bg-[#0a0806] py-24 md:py-32 overflow-hidden border-t border-sand/5">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(180,120,60,0.05) 2px, transparent 2px)', backgroundSize: '40px 40px' }} />

          <motion.div
            className="mx-auto w-full max-w-6xl px-6 relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={sectionVariant}
          >
            <div className="mb-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-[10px] text-emerald-400 mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="uppercase tracking-[0.2em] font-mono">Live Feed</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-sand-light mb-3">
                Every monument. In real time.
              </h2>
              <p className="text-[13px] text-sand/55 leading-relaxed">
                Our embedded tactical map gives an immediate overview of structural health across the medina.
                Markers pulse with dynamic risk levels, ensuring authorities have absolute situational awareness.
              </p>
            </div>

            <div className="relative w-full h-[500px] md:h-[600px] rounded-xl border border-sand/10 overflow-hidden shadow-2xl shadow-black/80 bg-[#0f0d0b]">
              <MapView embedded={true} />

              {/* Optional overlay UI to link to full map */}
              <div className="absolute top-4 right-4 z-[1001]">
                <button onClick={() => navigate('/monuments?view=map')} className="flex items-center gap-2 bg-[#1a1208]/80 backdrop-blur-md border border-sand/15 hover:border-copper-light/40 transition-colors rounded-lg px-4 py-2 shadow-lg group">
                  <span className="text-copper-light text-xs font-mono tracking-wider group-hover:text-copper-light/80">View Full Tactical Map</span>
                  <ChevronRight className="w-4 h-4 text-copper-light group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Stat overlay */}
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 z-[1001]">
                <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-2 md:gap-4 bg-[#1a1208]/90 backdrop-blur-md border border-sand/10 rounded-xl p-2 md:p-3 shadow-xl">
                  {[{ label: "Sites monitored", val: "12+" }, { label: "Coverage of ramparts", val: "100%" }, { label: "Alert Updates", val: "Active" }].map(stat => (
                    <div key={stat.label} className="bg-white/5 rounded-lg px-3 lg:px-4 py-2 flex flex-col items-center flex-1 md:flex-none">
                      <span className="text-sand-light font-heading text-lg leading-none mb-1">{stat.val}</span>
                      <span className="text-sand/40 text-[9px] font-mono uppercase tracking-wider">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* SECTION 5 — CLOSING CTA */}
        <section
          className="relative flex min-h-screen flex-col justify-center bg-[#080706] px-6 py-24"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(180,120,60,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          <motion.div
            className="mx-auto w-full max-w-3xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={sectionVariant}
            custom={0}
          >
            <motion.div variants={indexVariant}>
              <div className="mb-4 font-mono text-[11px] text-copper-light/40">05 / 05</div>
            </motion.div>

            <h2 className="font-heading text-[clamp(2.5rem,6vw,3.5rem)] leading-tight text-sand-light">
              <span className="block">Preserve the past.</span>
              <span className="block">Protect the future.</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-[13px] text-sand/55 leading-relaxed">
              Join the monitoring network safeguarding Taroudant&apos;s UNESCO-listed heritage for
              the next generation.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-copper-light px-7 py-2.5 text-sm font-medium text-charcoal hover:bg-copper-light/90 transition-colors"
              >
                Request Access
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/monuments?view=map')}
                className="inline-flex items-center gap-2 rounded-full border border-copper-light/40 bg-transparent px-7 py-2.5 text-sm font-medium text-copper-light hover:bg-copper-light/10 transition-colors"
              >
                View Public Map
              </button>
            </div>

            <div className="mt-8 text-[11px] text-sand/20 flex items-center gap-1 justify-center align-middle">
              Academic project — Ecole Nationale Supérieure d'Intelligence Artificielle et Sciences de Données, Taroudant (ENSIASD) <MapPin className="h-4 w-4" />
            </div>
          </motion.div>

          <footer className="mx-auto mt-16 w-full max-w-5xl border-t border-sand/5 pt-6 text-[11px] text-sand/25">
            <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
              <div>Taroudant Heritage Monitoring System</div>
              <div className="text-sand/30">
                Data sourced from field inspections and Regional Heritage Commission records
              </div>
              <div>© 2026 — Academic Use Only</div>
            </div>
          </footer>
        </section>
      </main>
      <AnimatePresence>
        {showRequestModal && (
          <RequestAccessModal
            isOpen={showRequestModal}
            onClose={() => setShowRequestModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
