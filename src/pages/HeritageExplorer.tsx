import { useState, useMemo } from 'react';
import { MOCK_MONUMENTS } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { getRiskBgColor } from '@/utils/riskCalculation';

const HeritageExplorer = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return MOCK_MONUMENTS.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.nameAr.includes(search);
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const matchRisk = riskFilter === 'all' || m.riskLevel === riskFilter;
      return matchSearch && matchType && matchRisk;
    });
  }, [search, typeFilter, riskFilter]);

  const types = ['all', 'gate', 'wall', 'tower', 'bastion'];
  const risks = ['all', 'safe', 'warning', 'critical'];

  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-foreground">Heritage Explorer</h1>
          <p className="text-muted-foreground mt-1">Discover Taroudant's historic ramparts and monuments</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search monuments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" /> Type:
            </div>
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Risk:</span>
            {risks.map(r => (
              <button key={r} onClick={() => setRiskFilter(r)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${riskFilter === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m, i) => {
            const riskBg = m.riskLevel === 'safe' ? 'bg-safe/10 text-safe' : m.riskLevel === 'warning' ? 'bg-warning/10 text-warning' : 'bg-critical/10 text-critical';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/monument/${m.id}`} className="block bg-card border border-border rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
                  {/* Color header representing monument */}
                  <div className="h-40 bg-gradient-to-br from-stone to-charcoal relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-copper-light mx-auto mb-2 opacity-60" />
                        <span className="text-sand/60 font-heading text-lg">{m.nameAr}</span>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded ${riskBg}`}>Risk: {m.riskScore}</span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="text-xs bg-charcoal/60 text-sand border-none">{m.type}</Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-heading text-lg text-foreground group-hover:text-primary transition-colors">{m.name}</h3>
                    <p className="text-muted-foreground text-xs mt-1">{m.era} · {m.constructionYear}</p>
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{m.significance}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">Last inspection: {m.lastInspection}</span>
                      <div className={`h-2 w-2 rounded-full ${getRiskBgColor(m.riskLevel)}`} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No monuments match your filters.</div>
        )}
      </div>
    </div>
  );
};

export default HeritageExplorer;
