import { useEffect, useState } from "react";
import { Landmark, ClipboardCheck, AlertTriangle, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { VulnerabilityBadge } from "@/components/VulnerabilityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  const [stats, setStats] = useState({ monuments: 0, inspections: 0, activeAlerts: 0, seismes: 0 });
  const [recentInspections, setRecentInspections] = useState<any[]>([]);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem("ths_token");
        if (!token) return;
        const res = await fetch(`${API_BASE}/dashboard/summary`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setStats(data.stats || stats);
        setRecentInspections(data.recentInspections || []);
      } catch {
        // keep defaults
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Tableau de bord</h2>
          <p className="text-sm text-muted-foreground">Vue d'ensemble du système de surveillance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Monuments" value={stats.monuments} icon={Landmark} variant="default" />
          <StatCard title="Inspections" value={stats.inspections} icon={ClipboardCheck} variant="success" />
          <StatCard title="Alertes actives" value={stats.activeAlerts} icon={AlertTriangle} variant="critical" />
          <StatCard title="Séismes enregistrés" value={stats.seismes} icon={Activity} variant="warning" />
        </div>

        <div className="bg-card border rounded-lg">
          <div className="p-5 border-b">
            <h3 className="font-display text-lg font-semibold text-foreground">Inspections récentes</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monument</TableHead>
                <TableHead>Inspecteur</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInspections.map((insp) => (
                <TableRow key={insp.id}>
                  <TableCell className="font-medium">{insp.monumentName}</TableCell>
                  <TableCell>{insp.inspector}</TableCell>
                  <TableCell><VulnerabilityBadge score={insp.vulnerabilityScore} /></TableCell>
                  <TableCell>{insp.inspectionDate}</TableCell>
                  <TableCell><StatusBadge status={insp.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
