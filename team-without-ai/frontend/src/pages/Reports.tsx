import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Rapport } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, CheckCircle, XCircle, Clock, Eye, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const prioriteColors: Record<string, string> = {
  Faible: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Moyen: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Élevé": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Critique: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statutConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  en_attente: { label: "En attente", icon: <Clock className="h-3.5 w-3.5" />, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  validé: { label: "Validé", icon: <CheckCircle className="h-3.5 w-3.5" />, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  rejeté: { label: "Rejeté", icon: <XCircle className="h-3.5 w-3.5" />, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAuthority = user?.role === "Authority";
  const isExpert = user?.role === "Expert";
  const [rapportsData, setRapportsData] = useState<Rapport[]>([]);
  const [inspectionsOptions, setInspectionsOptions] = useState<Array<{ id: string; monumentName: string; inspectionDate: string }>>([]);
  const [selectedRapport, setSelectedRapport] = useState<Rapport | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingRapport, setEditingRapport] = useState<Rapport | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formRapport, setFormRapport] = useState<{
    monumentName: string;
    diagnosticStructurel: string;
    analyseFissures: string;
    recommandations: string;
    niveauPriorite: Rapport["niveauPriorite"];
    inspectionId: string;
  }>({
    monumentName: "",
    diagnosticStructurel: "",
    analyseFissures: "",
    recommandations: "",
    niveauPriorite: "Moyen",
    inspectionId: "",
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
  const authHeaders = () => {
    const token = localStorage.getItem("ths_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const run = async () => {
      try {
        const [reportsRes, inspectionsRes] = await Promise.all([
          fetch(`${API_BASE}/reports`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE}/inspections`, { headers: { ...authHeaders() } }),
        ]);
        if (reportsRes.ok) setRapportsData(await reportsRes.json());
        if (inspectionsRes.ok) {
          const data = await inspectionsRes.json();
          setInspectionsOptions((data || []).map((i: any) => ({
            id: i.id,
            monumentName: i.monumentName,
            inspectionDate: i.inspectionDate,
          })));
        }
      } catch {
        // ignore
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidate = async (id: string) => {
    await fetch(`${API_BASE}/reports/${id.replace(/^r/, "")}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ statut: "validé", commentaireAutorite: "" }),
    });
    setRapportsData((prev) => prev.map((r) => (r.id === id ? { ...r, statut: "validé", commentaireAutorite: "" } : r)));
    setSelectedRapport(null);
    toast({ title: "Rapport validé", description: "Le rapport a été approuvé avec succès." });
  };

  const handleReject = async (id: string) => {
    await fetch(`${API_BASE}/reports/${id.replace(/^r/, "")}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ statut: "rejeté", commentaireAutorite: "" }),
    });
    setRapportsData((prev) => prev.map((r) => (r.id === id ? { ...r, statut: "rejeté", commentaireAutorite: "" } : r)));
    setSelectedRapport(null);
    toast({ title: "Rapport rejeté", description: "Le rapport a été rejeté." });
  };

  const openReview = (r: Rapport) => {
    setSelectedRapport(r);
  };

  const openNewRapport = () => {
    if (!user || !isExpert) return;
    setEditingRapport(null);
    setFormRapport({
      monumentName: "",
      diagnosticStructurel: "",
      analyseFissures: "",
      recommandations: "",
      niveauPriorite: "Moyen",
      inspectionId: "",
    });
    setIsEditDialogOpen(true);
  };

  const openEditRapport = (rapport: Rapport) => {
    if (!user || !isExpert || rapport.idUtilisateur !== user.id) return;
    setEditingRapport(rapport);
    setFormRapport({
      monumentName: rapport.monumentName,
      diagnosticStructurel: rapport.diagnosticStructurel,
      analyseFissures: rapport.analyseFissures,
      recommandations: rapport.recommandations,
      niveauPriorite: rapport.niveauPriorite,
      inspectionId: rapport.inspectionId,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteRapport = (id: string, ownerId: string) => {
    if (!user || !isExpert || ownerId !== user.id) return;
    const confirmed = window.confirm("Voulez-vous vraiment supprimer ce rapport ?");
    if (!confirmed) return;
    setRapportsData((prev) => prev.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
    toast({ title: "Rapport supprimé", description: "Le rapport a été supprimé." });
  };

  const handleSaveRapport = async () => {
    if (!user || !isExpert) return;
    if (!formRapport.inspectionId.trim() || !formRapport.diagnosticStructurel.trim() || !formRapport.recommandations.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez renseigner inspection, diagnostic et recommandations.",
        variant: "destructive",
      });
      return;
    }

    if (editingRapport) {
      const reportId = editingRapport.id.replace(/^r/, "");
      const res = await fetch(`${API_BASE}/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          diagnosticStructurel: formRapport.diagnosticStructurel,
          analyseFissures: formRapport.analyseFissures,
          recommandations: formRapport.recommandations,
          niveauPriorite: formRapport.niveauPriorite,
          inspectionId: formRapport.inspectionId || editingRapport.inspectionId,
        }),
      });
      if (!res.ok) {
        toast({ title: "Erreur", description: "Modification du rapport impossible.", variant: "destructive" });
        return;
      }
      const updated = await res.json();
      setRapportsData((prev) => prev.map((r) => (r.id === editingRapport.id ? updated : r)));
      toast({ title: "Rapport modifié", description: "Le rapport a été mis à jour." });
    } else {
      const res = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          inspectionId: formRapport.inspectionId,
          diagnosticStructurel: formRapport.diagnosticStructurel,
          analyseFissures: formRapport.analyseFissures,
          recommandations: formRapport.recommandations,
          niveauPriorite: formRapport.niveauPriorite,
        }),
      });
      if (!res.ok) {
        toast({ title: "Erreur", description: "Création du rapport impossible.", variant: "destructive" });
        return;
      }
      const nouveau = await res.json();
      setRapportsData((prev) => [nouveau, ...prev]);
      toast({ title: "Rapport créé", description: "Votre rapport a été ajouté et est en attente de validation." });
    }

    setIsEditDialogOpen(false);
    setEditingRapport(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Rapports</h2>
            <p className="text-sm text-muted-foreground">
              {isAuthority
                ? "Consultez, validez ou rejetez les rapports d'experts"
                : "Rapports d'inspection et analyses d'experts"}
            </p>
          </div>
          {isExpert && (
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={openNewRapport}
            >
              Nouveau rapport
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {rapportsData.map((r) => {
            const statut = statutConfig[r.statut];
            const isExpanded = expandedId === r.id;

            return (
              <div key={r.id} className="bg-card border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 p-2 rounded-lg bg-secondary">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-semibold text-foreground">{r.monumentName}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statut.className}`}>
                          {statut.icon}{statut.label}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${prioriteColors[r.niveauPriorite]}`}>
                          {r.niveauPriorite}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Par {r.nomExpert} · {r.dateRapport} · Inspection #{r.inspectionId}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.diagnosticStructurel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isAuthority && r.statut === "en_attente" && (
                      <Button size="sm" variant="outline" onClick={() => openReview(r)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />Examiner
                      </Button>
                    )}
                    {isExpert && user && r.idUtilisateur === user.id && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditRapport(r)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRapport(r.id, r.idUtilisateur)}
                        >
                          Supprimer
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4 bg-secondary/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diagnostic structurel</p>
                        <p className="text-sm text-foreground">{r.diagnosticStructurel}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Analyse des fissures</p>
                        <p className="text-sm text-foreground">{r.analyseFissures}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recommandations</p>
                      <p className="text-sm text-foreground">{r.recommandations}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Authority Review Dialog */}
      <Dialog open={!!selectedRapport} onOpenChange={(o) => !o && setSelectedRapport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Examiner le rapport</DialogTitle>
          </DialogHeader>
          {selectedRapport && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedRapport.monumentName}</Badge>
                <Badge variant="outline">{selectedRapport.niveauPriorite}</Badge>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Diagnostic structurel</p>
                  <p className="text-sm bg-secondary p-3 rounded-lg">{selectedRapport.diagnosticStructurel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Analyse des fissures</p>
                  <p className="text-sm bg-secondary p-3 rounded-lg">{selectedRapport.analyseFissures}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Recommandations</p>
                  <p className="text-sm bg-secondary p-3 rounded-lg">{selectedRapport.recommandations}</p>
                </div>
              </div>

              {/* Pas de commentaire : l'autorité valide / rejette directement */}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedRapport(null)}>Annuler</Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedRapport.id)}
                >
                  <XCircle className="h-4 w-4 mr-1.5" />Rejeter
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleValidate(selectedRapport.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />Valider
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Expert Create / Edit Rapport Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingRapport ? "Modifier le rapport" : "Nouveau rapport d'expert"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Inspection</Label>
                <Select
                  value={formRapport.inspectionId}
                  onValueChange={(v) =>
                    setFormRapport((prev) => ({
                      ...prev,
                      inspectionId: v,
                      monumentName: inspectionsOptions.find((o) => o.id === v)?.monumentName || prev.monumentName,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une inspection" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectionsOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.monumentName} - {opt.inspectionDate} ({opt.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Niveau de priorité</Label>
                <Select
                  value={formRapport.niveauPriorite}
                  onValueChange={(v) =>
                    setFormRapport((prev) => ({
                      ...prev,
                      niveauPriorite: v as Rapport["niveauPriorite"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Faible">Faible</SelectItem>
                    <SelectItem value="Moyen">Moyen</SelectItem>
                    <SelectItem value="Élevé">Élevé</SelectItem>
                    <SelectItem value="Critique">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Diagnostic structurel</Label>
              <Textarea
                value={formRapport.diagnosticStructurel}
                onChange={(e) =>
                  setFormRapport((prev) => ({
                    ...prev,
                    diagnosticStructurel: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Décrivez le diagnostic structurel..."
              />
            </div>

            <div className="space-y-1">
              <Label>Analyse des fissures (optionnel)</Label>
              <Textarea
                value={formRapport.analyseFissures}
                onChange={(e) =>
                  setFormRapport((prev) => ({
                    ...prev,
                    analyseFissures: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Détaillez les fissures observées..."
              />
            </div>

            <div className="space-y-1">
              <Label>Recommandations</Label>
              <Textarea
                value={formRapport.recommandations}
                onChange={(e) =>
                  setFormRapport((prev) => ({
                    ...prev,
                    recommandations: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Listez vos recommandations d'intervention..."
              />
            </div>

            <div className="space-y-1">
              <Label>Monument (auto)</Label>
              <Input value={formRapport.monumentName} readOnly />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingRapport(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSaveRapport}>
                {editingRapport ? "Enregistrer les modifications" : "Créer le rapport"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
