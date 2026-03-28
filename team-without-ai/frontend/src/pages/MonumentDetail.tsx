import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import type { Alerte, Inspection, Monument, Rapport } from "@/lib/mock-data";
import { VulnerabilityBadge } from "@/components/VulnerabilityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, ClipboardCheck, AlertTriangle, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function MonumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [monument, setMonument] = useState<Monument | null>(null);
  const [inspectionsData, setInspectionsData] = useState<Inspection[]>([]);
  const [alertsData, setAlertsData] = useState<Alerte[]>([]);
  const [reportsData, setReportsData] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
  const token = localStorage.getItem("ths_token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const run = async () => {
      try {
        const numericId = (id || "").replace(/^m/, "");
        if (!numericId) throw new Error("Missing id");
        const res = await fetch(`${API_BASE}/monuments/${numericId}`, { headers: authHeaders });
        if (!res.ok) {
          setMonument(null);
          return;
        }
        const data = await res.json();
        setMonument(data as Monument);
      } catch {
        setMonument(null);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const run = async () => {
      try {
        if (!monument) return;
        if (!token) return;

        const [insRes, alRes, repRes] = await Promise.all([
          fetch(`${API_BASE}/inspections`, { headers: authHeaders }),
          fetch(`${API_BASE}/alerts`, { headers: authHeaders }),
          fetch(`${API_BASE}/reports`, { headers: authHeaders }),
        ]);

        if (insRes.ok) setInspectionsData(await insRes.json());
        if (alRes.ok) setAlertsData(await alRes.json());
        if (repRes.ok) setReportsData(await repRes.json());
      } catch {
        // ignore
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monument?.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <p className="text-sm text-muted-foreground">Chargement du monument...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!monument) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <p className="text-muted-foreground">Monument introuvable.</p>
          <Button variant="outline" onClick={() => navigate("/monuments")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />Retour
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = user?.role === "Admin";
  const isExpert = user?.role === "Expert";
  const isAuthority = user?.role === "Authority";

  const ownedInspections = isExpert
    ? inspectionsData.filter((i: any) => String(i.expertId || "") === String(user?.id || ""))
    : inspectionsData;

  const monumentInspections = ownedInspections.filter((i) => i.monumentId === monument.id);
  const monumentInspectionIds = new Set(monumentInspections.map((i) => i.id));

  const monumentAlertes = alertsData.filter((a) => monumentInspectionIds.has(a.inspectionId));
  const monumentRapports = reportsData.filter((r) => monumentInspectionIds.has(r.inspectionId));

  const visibleReports = isExpert ? monumentRapports.filter((r) => r.idUtilisateur === user?.id) : monumentRapports;

  const canInspect = user?.role !== "Authority";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/monuments")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />Retour aux monuments
        </Button>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="relative rounded-lg overflow-hidden">
              {monument.image ? (
                <img src={monument.image} alt={monument.name} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 bg-secondary" />
              )}
              <div className="absolute top-3 right-3">
                <VulnerabilityBadge score={monument.vulnerabilityScore} size="md" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">{monument.name}</h2>
              <StatusBadge status={monument.structuralState} />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{monument.location}</p>
              <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{monument.dateCreation}</p>
            </div>
            <p className="text-foreground">{monument.description}</p>
            {canInspect && (
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => navigate(`/inspections/new?monument=${monument.id}`)}
              >
                <ClipboardCheck className="h-4 w-4 mr-1.5" />Lancer une inspection
              </Button>
            )}
          </div>
        </div>

        {/* Inspections */}
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />Inspections ({monumentInspections.length})
          </h3>
          {monumentInspections.length > 0 ? (
            <div className="bg-card border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdmin ? (
                      <>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Inspecteur</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Fissures</TableHead>
                      </>
                    ) : (
                      <TableHead>Fissures</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monumentInspections.map((ins) => (
                    <TableRow key={ins.id}>
                      {isAdmin ? (
                        <>
                          <TableCell>{ins.inspectionDate}</TableCell>
                          <TableCell>{ins.inspectionType}</TableCell>
                          <TableCell>{ins.inspector}</TableCell>
                          <TableCell><VulnerabilityBadge score={ins.vulnerabilityScore} size="sm" /></TableCell>
                          <TableCell><StatusBadge status={ins.status} /></TableCell>
                          <TableCell>{ins.fissures.length}</TableCell>
                        </>
                      ) : (
                        <TableCell>{ins.fissures.length}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune inspection enregistrée.</p>
          )}
        </div>

        {/* Alertes */}
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />Alertes ({monumentAlertes.length})
          </h3>
          {isAdmin && monumentAlertes.length > 0 ? (
            <div className="bg-card border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monumentAlertes.map((al) => (
                    <TableRow key={al.id}>
                      <TableCell>{isAdmin ? al.date : "—"}</TableCell>
                      <TableCell className="max-w-sm truncate">{isAdmin ? al.message : "—"}</TableCell>
                      <TableCell>{isAdmin ? <StatusBadge status={al.alertLevel} /> : "—"}</TableCell>
                      <TableCell>{isAdmin ? <StatusBadge status={al.status} /> : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {monumentAlertes.length > 0 ? "Détails masqués (réservé à Admin)." : "Aucune alerte associée."}
            </p>
          )}
        </div>

        {/* Rapports */}
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />Rapports ({visibleReports.length})
          </h3>
          {isAdmin && visibleReports.length > 0 ? (
            <div className="bg-card border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assigné à</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleReports.map((rp) => (
                    <TableRow key={rp.id}>
                      <TableCell>{rp.dateRapport}</TableCell>
                      <TableCell className="max-w-sm truncate">{rp.diagnosticStructurel}</TableCell>
                      <TableCell>{rp.nomExpert}</TableCell>
                      <TableCell><StatusBadge status={rp.statut === "validé" ? "Stable" : rp.statut === "rejeté" ? "Critique" : "À surveiller"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {visibleReports.length > 0 ? "Détails masqués (réservé à Admin)." : "Aucun rapport associé."}
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
