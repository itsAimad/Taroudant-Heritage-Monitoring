import { motion } from 'framer-motion';
import { Shield, BookOpen, Lock, Map, Layers, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } })
};

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0806] pt-24 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeIn}>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-[1px] w-8 bg-copper-light" />
            <span className="text-[10px] text-copper-light font-mono tracking-[0.3em] uppercase">Project Background</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-sand-light mb-6">
            Taroudant Heritage Shield
          </h1>
          <p className="text-lg md:text-xl text-sand/55 leading-relaxed mb-16 max-w-3xl">
            A digital fortification system developed to preserve the structural integrity of Taroudant's earthen ramparts through real-time risk modeling and field data aggregation.
          </p>
        </motion.div>

        <div className="space-y-16">
          {/* Section: The Challenge */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={1} variants={fadeIn}>
            <div className="grid md:grid-cols-[1fr_2fr] gap-8 border-t border-sand/10 pt-8">
              <h2 className="font-heading text-2xl text-sand-light">The Challenge</h2>
              <div className="text-[14px] text-sand/50 leading-relaxed space-y-4">
                <p>
                  Taroudant possesses 7.5 kilometers of continuous pisé (rammed earth) walls, considered some of the best-preserved fortifications in North Africa. However, extreme weather, urban expansion, and natural material degradation constantly threaten these monumental structures.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {[
                    { val: "7.5km", label: "Wall Perimeter" },
                    { val: "130+", label: "Defensive Towers" },
                    { val: "5", label: "Historic Gates" },
                    { val: "1000y", label: "Structural Age" }
                  ].map(stat => (
                    <div key={stat.label} className="bg-[#140e0a] border border-sand/5 rounded-lg p-4 text-center shadow-lg shadow-black/20">
                      <div className="font-mono text-xl text-copper-light mb-1">{stat.val}</div>
                      <div className="text-[9px] uppercase tracking-wider font-mono text-sand/30">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section: The Solution */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={2} variants={fadeIn}>
            <div className="grid md:grid-cols-[1fr_2fr] gap-8 border-t border-sand/10 pt-8">
              <h2 className="font-heading text-2xl text-sand-light">The Solution</h2>
              <div className="text-[14px] text-sand/50 leading-relaxed space-y-6">
                <p>
                  The Heritage Shield replaces disparate analog inspection methods with a unified, role-based digital catalog. Field inspectors capture on-site metrics (cracks, humidity, erosion) which the system's algorithm instantly translates into actionable vulnerability scores.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Map, title: "Tactical Visualization", desc: "Interactive map plotting realtime monument health." },
                    { icon: Activity, title: "Algorithmic Scoring", desc: "Automated risk calculation based on empirical field data." },
                    { icon: Shield, title: "Role-Based Security", desc: "Strict access control separating admins, inspectors, and public." },
                    { icon: Lock, title: "Immutable Trailing", desc: "Every inspection and status change is permanently logged." }
                  ].map(feature => (
                    <div key={feature.title} className="flex gap-4 bg-[#140e0a] border border-sand/5 rounded-lg p-5 shadow-lg shadow-black/20">
                      <feature.icon className="w-5 h-5 text-copper-light shrink-0 mt-0.5" />
                      <div>
                        <div className="font-heading text-sand-light text-base mb-1">{feature.title}</div>
                        <div className="text-[12px] text-sand/40 leading-relaxed">{feature.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section: Built With */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={3} variants={fadeIn}>
            <div className="grid md:grid-cols-[1fr_2fr] gap-8 border-t border-sand/10 pt-8">
              <h2 className="font-heading text-2xl text-sand-light">Built With</h2>
              <div>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono tracking-wider">
                  {[
                    "React 18", "TypeScript", "Tailwind CSS", "Framer Motion", 
                    "Leaflet.js", "React Router", "FastAPI", "Python 3.12", 
                    "SQLAlchemy", "MySQL", "JWT/Auth", "AES-256"
                  ].map(tech => (
                    <div key={tech} className="px-3 py-1.5 rounded-full border border-sand/10 bg-[#140e0a] text-sand/60">
                      {tech}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section: Academic Context */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={4} variants={fadeIn}>
            <div className="grid md:grid-cols-[1fr_2fr] gap-8 border-t border-sand/10 pt-8">
              <h2 className="font-heading text-2xl text-sand-light">Academic Context</h2>
              <div className="bg-[#140e0a] border border-sand/10 rounded-xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-copper-light/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <BookOpen className="w-6 h-6 text-copper-light" />
                  <div className="h-4 w-px bg-sand/20" />
                  <span className="text-[10px] font-mono tracking-widest text-sand/40 uppercase">Research Initiative</span>
                </div>
                <h3 className="font-heading text-xl text-sand-light mb-2 relative z-10">Ibn Zohr University — ENSIASD</h3>
                <p className="text-[13px] text-sand/50 leading-relaxed mb-6 relative z-10">
                  This system was conceptualized and developed as an academic capstone project at the École Nationale Supérieure d'Intelligence Artificielle et Sciences de Données (ENSIASD) in Taroudant, Morocco. It seeks to demonstrate the vital intersection of modern data engineering and historical conservation.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-sand/10 relative z-10">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-sand/30 mb-1">Institution</div>
                    <div className="text-sm text-sand/70">Ibn Zohr University</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-sand/30 mb-1">Program</div>
                    <div className="text-sm text-sand/70">Data Science &amp; AI</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Closing CTAs */}
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          custom={5} 
          variants={fadeIn}
          className="mt-20 pt-16 border-t border-sand/5 flex flex-col items-center text-center"
        >
          <div className="w-12 h-12 rounded-full border border-sand/10 bg-[#1a1208] flex items-center justify-center mb-6">
            <Layers className="w-5 h-5 text-copper-light" />
          </div>
          <h2 className="font-heading text-2xl text-sand-light mb-4">Ready to explore?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/monuments')}
              className="inline-flex items-center gap-2 rounded-full border border-copper-light bg-copper-light/10 px-7 py-2.5 text-sm font-medium text-copper-light hover:bg-copper-light hover:text-charcoal transition-colors"
            >
              Explore Monuments
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 rounded-full border border-sand/20 bg-transparent px-7 py-2.5 text-sm font-medium text-sand/60 hover:text-sand hover:bg-sand/10 transition-colors"
            >
              Enter System
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
