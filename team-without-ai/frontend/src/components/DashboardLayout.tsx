import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/lib/auth-context";
import { Navigate, useNavigate } from "react-router-dom";
import { alertes as mockAlertes, seismes as mockSeismes } from "@/lib/mock-data";
import { Bell, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alertes, setAlertes] = useState(mockAlertes);
  const [seismes, setSeismes] = useState<(typeof mockSeismes[number] & { read?: boolean })[]>(mockSeismes);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    let timer: number | undefined;
    const run = async () => {
      try {
        const token = localStorage.getItem("ths_token");
        if (!token) return;

        const shouldFetchAlerts = user.role === "Authority";
        const shouldFetchSeismes = user.role === "Expert" || user.role === "Authority";

        const promises: Array<Promise<any>> = [];
        if (shouldFetchSeismes) {
          promises.push(fetch(`${API_BASE}/seismes`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : null)));
        } else {
          promises.push(Promise.resolve(null));
        }
        if (shouldFetchAlerts) {
          promises.push(fetch(`${API_BASE}/alerts`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : null)));
        } else {
          promises.push(Promise.resolve(null));
        }

        const [seisData, alertData] = await Promise.all(promises);
        if (seisData) setSeismes(seisData);
        if (alertData) setAlertes(alertData);
      } catch {
        // fallback to mock data if API is unavailable
      }
    };

    run();
    timer = window.setInterval(() => run(), 10000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [API_BASE, user.role]);

  const activeAlertes = alertes.filter((a) => a.status !== "Résolue");
  const unreadAlertCount = activeAlertes.filter((a) => !a.received).length;
  const markAllAlertsRead = async () => {
    try {
      const token = localStorage.getItem("ths_token");
      if (!token) return;
      await fetch(`${API_BASE}/alerts/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlertes((prev) => prev.map((a) => ({ ...a, received: true })));
    } catch {
      // ignore
    }
  };

  const recentSeismes = [...seismes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const unreadSeismeCount = recentSeismes.filter((s) => !s.read).length;
  const markAllSeismesRead = async () => {
    try {
      const token = localStorage.getItem("ths_token");
      if (!token) return;
      await fetch(`${API_BASE}/seismes/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSeismes((prev) => prev.map((s) => ({ ...s, read: true })));
    } catch {
      // ignore
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <h1 className="font-display text-lg text-foreground">Taroudant Heritage Shield</h1>
            <div className="ml-auto flex items-center gap-2">
              {(user.role === "Expert" || user.role === "Authority") && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Activity className="h-5 w-5" />
                      {unreadSeismeCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-warning text-[10px] font-bold text-warning-foreground flex items-center justify-center">
                          {unreadSeismeCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <span className="font-display font-semibold text-sm">Séismes récents</span>
                      {unreadSeismeCount > 0 && (
                        <button onClick={markAllSeismesRead} className="text-xs text-primary hover:underline">
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {recentSeismes.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center">Aucun séisme récent</p>
                      ) : (
                        recentSeismes.map((s) => (
                          <button
                            key={s.id}
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("ths_token");
                                if (token) {
                                  await fetch(`${API_BASE}/seismes/${String(s.id).replace(/^s/, "")}/read`, {
                                    method: "POST",
                                    headers: { Authorization: `Bearer ${token}` },
                                  });
                                }
                              } catch {
                                // ignore
                              }
                              setSeismes((prev) => prev.map((x) => (x.id === s.id ? { ...x, read: true } : x)));
                              navigate("/seismes");
                            }}
                            className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                              !s.read ? "bg-warning/5" : ""
                            }`}
                          >
                            <p className={`text-xs font-semibold ${s.magnitude >= 5 ? "text-destructive" : s.magnitude >= 4 ? "text-warning" : "text-muted-foreground"}`}>
                              Magnitude {s.magnitude}
                            </p>
                            <p className="text-sm text-foreground line-clamp-1">{s.location}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.intensity} · {s.date}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {user.role === "Authority" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadAlertCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                          {unreadAlertCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <span className="font-display font-semibold text-sm">Notifications</span>
                      {unreadAlertCount > 0 && (
                        <button onClick={markAllAlertsRead} className="text-xs text-primary hover:underline">
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {activeAlertes.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center">Aucune alerte</p>
                      ) : (
                        activeAlertes.map((a) => (
                          <button
                            key={a.id}
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("ths_token");
                                if (token) {
                                  await fetch(`${API_BASE}/alerts/${String(a.id).replace(/^a/, "")}/read`, {
                                    method: "POST",
                                    headers: { Authorization: `Bearer ${token}` },
                                  });
                                }
                              } catch {
                                // ignore
                              }
                              setAlertes((prev) => prev.map((x) => (x.id === a.id ? { ...x, received: true } : x)));
                              navigate("/alerts");
                            }}
                            className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                              !a.received ? "bg-primary/5" : ""
                            }`}
                          >
                            <p className="text-xs font-semibold text-destructive">{a.alertLevel}</p>
                            <p className="text-sm text-foreground line-clamp-1">{a.message}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{a.monumentName} · {a.date}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto animate-fade-in">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}