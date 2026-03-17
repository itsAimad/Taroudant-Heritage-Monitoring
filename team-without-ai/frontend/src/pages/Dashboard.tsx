import { Landmark, ClipboardCheck, AlertTriangle, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { VulnerabilityBadge } from "@/components/VulnerabilityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { monuments, inspections, alertes, seismes } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  const recentInspections = [...inspections].sort(
    (a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime()
  ).slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Tableau de bord</h2>
          <p className="text-sm text-muted-foreground">Vue d'ensemble du système de surveillance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Monuments" value={monuments.length} icon={Landmark} variant="default" />
          <StatCard title="Inspections" value={inspections.length} icon={ClipboardCheck} variant="success" />
          <StatCard title="Alertes actives" value={alertes.filter(a => a.status === "Active").length} icon={AlertTriangle} variant="critical" />
          <StatCard title="Séismes enregistrés" value={seismes.length} icon={Activity} variant="warning" />
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
