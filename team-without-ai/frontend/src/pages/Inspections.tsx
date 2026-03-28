import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Inspection, Fissure, Monument } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { InspectionCard } from "@/components/InspectionCard";
import { VulnerabilityBadge } from "@/components/VulnerabilityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ClipboardCheck, Pencil } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

function parseNombreFissuresInput(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? Math.min(50, Math.max(1, parsed)) : 1;
}

type InspectionWithOwner = Inspection & { expertId?: string };

export default function Inspections() {
  const [searchParams] = useSearchParams();
  const preselectedMonument = searchParams.get("monument") || "";
  const { user } = useAuth();
  const { toast } = useToast();
  const canInspect = user?.role === "Expert";
  const [inspectionsData, setInspectionsData] = useState<InspectionWithOwner[]>([]);
  const [monumentsData, setMonumentsData] = useState<Monument[]>([]);
  const [open, setOpen] = useState(canInspect && !!preselectedMonument);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    monumentId: preselectedMonument,
    date: new Date().toISOString().split("T")[0],
    type: "Périodique",
    observation: "",
    image: "",
  });
  const [fissures, setFissures] = useState<Fissure[]>([]);
  const [nombreFissuresAajouter, setNombreFissuresAajouter] = useState("3");
  const vulnScore = 0;
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

  const authHeaders = () => {
    const token = localStorage.getItem("ths_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const run = async () => {
      try {
        const [insRes, monRes] = await Promise.all([
          fetch(`${API_BASE}/inspections`, { headers: { ...authHeaders() } }),
          fetch(`${API_BASE}/monuments`, { headers: { ...authHeaders() } }),
        ]);
        if (insRes.ok) setInspectionsData(await insRes.json());
        if (monRes.ok) setMonumentsData(await monRes.json());
      } catch {
        // ignore
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newFissureRow = (): Fissure => ({
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    description: "",
    detectionDate: form.date,
    gravityLevel: "low",
  });

  const nFissuresAajouter = parseNombreFissuresInput(nombreFissuresAajouter);

  const addFissuresParNombre = () => {
    setFissures((prev) => [...prev, ...Array.from({ length: nFissuresAajouter }, () => newFissureRow())]);
  };
  const updateFissure = (index: number, field: keyof Fissure, value: string) => {
    const updated = [...fissures];
    (updated[index] as any)[field] = value;
    setFissures(updated);
  };
  const removeFissure = (index: number) => setFissures(fissures.filter((_, i) => i !== index));

  const isOwner = (insp: InspectionWithOwner) => canInspect && String(insp.expertId || "") === String(user?.id || "");

  const openEdit = (insp: InspectionWithOwner) => {
    if (!isOwner(insp)) return;
    setEditingId(insp.id);
    setForm({
      monumentId: insp.monumentId,
      date: insp.inspectionDate,
      type: insp.inspectionType,
      observation: insp.observation,
      image: insp.image || "",
    });
    const loadedFissures = (insp.fissures || []).map((f) => ({ ...f, detectionDate: insp.inspectionDate }));
    setFissures(loadedFissures);
    // Make the input match what is stored in DB
    setNombreFissuresAajouter(String(Math.max(1, loadedFissures.length)));
    setOpen(true);
  };

  const resetForm = () => {
    setForm({ monumentId: "", date: new Date().toISOString().split("T")[0], type: "Périodique", observation: "", image: "" });
    setFissures([]);
    setNombreFissuresAajouter("3");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingId;
    const endpoint = isEditing ? `${API_BASE}/inspections/${editingId!.replace(/^i/, "")}` : `${API_BASE}/inspections`;
    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          monumentId: form.monumentId,
          inspectionDate: form.date,
          inspectionType: form.type,
          observation: form.observation,
          image: form.image,
          status: "En cours",
          fissures: fissures.map((f) => ({ ...f, detectionDate: form.date })),
        }),
      });
      if (!res.ok) {
        toast({ title: "Erreur", description: "Enregistrement inspection impossible.", variant: "destructive" });
        return;
      }
      const saved = await res.json();
      setInspectionsData((prev) => (isEditing ? prev.map((i) => (i.id === saved.id ? saved : i)) : [saved, ...prev]));
      toast({ title: isEditing ? "Inspection modifiée" : "Inspection créée" });
      resetForm();
      setOpen(false);
    } catch {
      toast({ title: "Erreur", description: "Problème de connexion backend.", variant: "destructive" });
    }
  };

  const handleDeleteInspection = async (insp: InspectionWithOwner) => {
    if (!isOwner(insp)) return;
    const ok = window.confirm("Voulez-vous supprimer cette inspection ?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/inspections/${insp.id.replace(/^i/, "")}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      if (!res.ok) {
        toast({ title: "Suppression impossible", description: "Inspection liée à un rapport/alerte.", variant: "destructive" });
        return;
      }
      setInspectionsData((prev) => prev.filter((i) => i.id !== insp.id));
      toast({ title: "Inspection supprimée" });
    } catch {
      toast({ title: "Erreur", description: "Problème de connexion backend.", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Inspections</h2>
            <p className="text-sm text-muted-foreground">Gestion des inspections de monuments</p>
          </div>
          {canInspect && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-1.5" />Nouvelle inspection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">{editingId ? "Modifier l'inspection" : "Nouvelle inspection"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monument</Label>
                      <Select value={form.monumentId} onValueChange={(v) => setForm({ ...form, monumentId: v })}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent>
                          {monumentsData.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Type d'inspection</Label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Périodique">Périodique</SelectItem>
                          <SelectItem value="Post-séisme">Post-séisme</SelectItem>
                          <SelectItem value="Urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observations</Label>
                    <Textarea value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} placeholder="Décrivez vos observations..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Image (URL)</Label>
                    <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Détection de fissures</Label>
                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
                        <div className="space-y-2 min-w-0 flex-1 sm:max-w-[220px]">
                          <Label htmlFor="nombre-fissures" className="text-sm font-normal text-muted-foreground">
                            Nombre de fissures à ajouter
                          </Label>
                          <Input
                            id="nombre-fissures"
                            type="number"
                            min={1}
                            max={50}
                            className="w-full"
                            value={nombreFissuresAajouter}
                            onChange={(e) => setNombreFissuresAajouter(e.target.value)}
                          />
                        </div>
                        <Button type="button" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={addFissuresParNombre}>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter {nFissuresAajouter} fissure{nFissuresAajouter > 1 ? "s" : ""}
                        </Button>
                      </div>
                    </div>
                    {fissures.map((fissure, idx) => (
                      <div key={fissure.id} className="border rounded-lg p-4 space-y-3 bg-secondary/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Fissure #{idx + 1}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeFissure(idx)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Description</Label>
                          <Input value={fissure.description} onChange={(e) => updateFissure(idx, "description", e.target.value)} placeholder="Description de la fissure" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Niveau de gravité</Label>
                          <Select value={fissure.gravityLevel} onValueChange={(v) => updateFissure(idx, "gravityLevel", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Faible</SelectItem>
                              <SelectItem value="medium">Moyen</SelectItem>
                              <SelectItem value="high">Élevé</SelectItem>
                              <SelectItem value="critical">Critique</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {form.monumentId && (
                    <div className="bg-secondary rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Score de vulnérabilité calculé</p>
                        <p className="text-xs text-muted-foreground">Calcul réel côté backend/procédures SQL</p>
                      </div>
                      <VulnerabilityBadge score={vulnScore} size="md" />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Annuler</Button>
                    <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <ClipboardCheck className="h-4 w-4 mr-1.5" />
                      {editingId ? "Enregistrer les modifications" : "Enregistrer l'inspection"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inspectionsData.map((insp) => (
            <div key={insp.id} className="space-y-2">
              <InspectionCard inspection={insp} />
              {isOwner(insp) && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(insp)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />Modifier
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteInspection(insp)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />Supprimer
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
