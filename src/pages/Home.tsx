import { Link } from 'react-router-dom';
import { Shield, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import RampartScene from '@/components/3D/RampartScene';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen bg-charcoal overflow-hidden">
      <RampartScene />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-transparent to-charcoal/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-transparent to-charcoal/50 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="max-w-3xl"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-copper-light" />
            <span className="text-copper-light font-mono text-sm tracking-[0.3em] uppercase">Heritage Monitoring System</span>
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-semibold text-sand-light leading-[1.1] mb-6">
            Taroudant
            <br />
            <span className="text-copper-light">Heritage Shield</span>
          </h1>

          <p className="text-sand/70 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed font-body">
            Monitoring vulnerabilities of historic ramparts and monuments through advanced risk assessment and digital preservation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity">
              {isAuthenticated ? 'Go to Dashboard' : 'Enter System'}
            </Link>
            <Link to="/heritage" className="px-8 py-3 border border-copper-light/40 text-copper-light font-medium rounded-md hover:bg-copper-light/10 transition-colors">
              Explore Heritage
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-20"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-6 w-6 text-sand/40" />
        </motion.div>
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-charcoal/90 backdrop-blur-md border-t border-sand/10">
        <div className="max-w-5xl mx-auto px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '8', label: 'Monuments Monitored' },
            { value: '7.5km', label: 'Rampart Length' },
            { value: '500+', label: 'Years of History' },
            { value: '3', label: 'Active Alerts' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-2xl text-copper-light">{stat.value}</div>
              <div className="text-sand/50 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
