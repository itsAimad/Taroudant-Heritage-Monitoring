import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Alerte } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, Bell, BellOff, Clock, MapPin } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const alertLevelStyles: Record<string, string> = {
  Critical: "border-l-4 border-l-destructive bg-destructive/5",
  Warning: "border-l-4 border-l-yellow-500 bg-yellow-500/5",
  Info: "border-l-4 border-l-blue-500 bg-blue-500/5",
};

const alertLevelIcon: Record<string, string> = {
  Critical: "text-destructive",
  Warning: "text-yellow-500",
  Info: "text-blue-500",
};

export default function Alerts() {
  const { user } = useAuth();
  const isAuthority = user?.role === "Authority";
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

  const authHeaders = () => {
    const token = localStorage.getItem("ths_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/alerts`, { headers: { ...authHeaders() } });
        if (!res.ok) return;
        setAlertes(await res.json());
      } catch {
        // ignore
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleReceived = async (id: string) => {
    const target = alertes.find((a) => a.id === id);
    if (!target) return;
    if (!target.received) {
      try {
        await fetch(`${API_BASE}/alerts/${id.replace(/^a/, "")}/read`, {
          method: "POST",
          headers: { ...authHeaders() },
        });
      } catch {
        // ignore
      }
    }
    setAlertes((prev) => prev.map((a) => (a.id === id ? { ...a, received: !a.received } : a)));
  };

  if (isAuthority) {
    const receivedAlerts = alertes;

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Alertes reçues</h2>
            <p className="text-sm text-muted-foreground">Notifications d'alertes envoyées par le système</p>
          </div>

          <div className="space-y-3">
            {receivedAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Aucune alerte reçue pour le moment.</p>
              </div>
            ) : (
              receivedAlerts.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-lg border p-4 ${alertLevelStyles[a.alertLevel] || ""}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${alertLevelIcon[a.alertLevel]}`} />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={a.alertLevel} />
                        <StatusBadge status={a.status} />
                        {a.received ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                            Reçue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium">
                            <BellOff className="h-3 w-3" />
                            Non lue
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{a.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{a.monumentName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{a.date}
                        </span>
                        <span>Type : {a.degradationType}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                        <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleReceived(a.id)}
                        disabled={a.received}
                      >
                          {a.received ? "Déjà lue" : "Marquer comme lue"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Alertes</h2>
          <p className="text-sm text-muted-foreground">Surveillance des alertes de dégradation</p>
        </div>

        <div className="bg-card border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Niveau</TableHead>
                <TableHead>Monument</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Reçue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertes.map((a) => (
                <TableRow key={a.id}>
                  <TableCell><StatusBadge status={a.alertLevel} /></TableCell>
                  <TableCell className="font-medium">{a.monumentName}</TableCell>
                  <TableCell className="max-w-xs truncate">{a.message}</TableCell>
                  <TableCell>{a.degradationType}</TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell>
                    {a.received ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Bell className="h-4 w-4 text-emerald-500" />
                        Reçue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <BellOff className="h-4 w-4" />
                        Non lue
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
