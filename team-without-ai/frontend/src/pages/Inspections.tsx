import { useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { inspections as initialInspections, monuments, Inspection, Fissure } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { InspectionCard } from "@/components/InspectionCard";
import { VulnerabilityBadge } from "@/components/VulnerabilityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload, ClipboardCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

function calculateVulnerability(monumentId: string, fissures: Fissure[]): number {
  const monument = monuments.find((m) => m.id === monumentId);
  if (!monument) return 0;
  const centuryMatch = monument.dateCreation.match(/(X+I*V*I*e?)/);
  let ageScore = 30;
  if (centuryMatch) {
    const roman = centuryMatch[1].replace("e", "");
    const century = roman.length > 3 ? 13 : roman.length > 2 ? 15 : 17;
    ageScore = Math.min(40, Math.max(10, (2025 - century * 100) / 20));
  }
  const gravityWeights = { low: 5, medium: 15, high: 30, critical: 50 };
  const crackScore = fissures.reduce((sum, f) => sum + gravityWeights[f.gravityLevel], 0);
  return Math.min(100, Math.round(ageScore + crackScore));
}

export default function Inspections() {
  const [searchParams] = useSearchParams();
  const preselectedMonument = searchParams.get("monument") || "";
  const { user } = useAuth();
  const canInspect = user?.role === "Expert";
  const [inspectionsData, setInspectionsData] = useState<Inspection[]>(initialInspections);
  const [open, setOpen] = useState(canInspect && !!preselectedMonument);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    monumentId: preselectedMonument,
    date: new Date().toISOString().split("T")[0],
    type: "Périodique",
    observation: "",
  });
  const [fissures, setFissures] = useState<Fissure[]>([]);
  const vulnScore = form.monumentId ? calculateVulnerability(form.monumentId, fissures) : 0;

  const addFissure = () => {
    setFissures([...fissures, { id: `f-${Date.now()}`, description: "", detectionDate: form.date, gravityLevel: "low" }]);
  };
  const updateFissure = (index: number, field: keyof Fissure, value: string) => {
    const updated = [...fissures];
    (updated[index] as any)[field] = value;
    setFissures(updated);
  };
  const removeFissure = (index: number) => setFissures(fissures.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monument = monuments.find((m) => m.id === form.monumentId);
    const newInspection: Inspection = {
      id: `i${Date.now()}`, monumentId: form.monumentId, monumentName: monument?.name || "",
      inspector: "Dr. Amina Benali", inspectionDate: form.date, inspectionType: form.type,
      observation: form.observation, vulnerabilityScore: vulnScore, status: "En cours", fissures,
      image: mediaPreview || undefined,
    };
    setInspectionsData([newInspection, ...inspectionsData]);
    setForm({ monumentId: "", date: new Date().toISOString().split("T")[0], type: "Périodique", observation: "" });
    setFissures([]);
    setMediaFiles([]);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
    setOpen(false);
  };

  const handleMediaClick = () => {
    fileInputRef.current?.click();
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const selectedFiles = Array.from(files);
    setMediaFiles(selectedFiles);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    const firstPreview = URL.createObjectURL(selectedFiles[0]);
    setMediaPreview(firstPreview);
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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-1.5" />Nouvelle inspection
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Nouvelle inspection</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monument</Label>
                    <Select value={form.monumentId} onValueChange={(v) => setForm({ ...form, monumentId: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {monuments.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
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

                {/* Crack Detection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-display">Détection de fissures</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFissure}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Ajouter une fissure
                    </Button>
                  </div>
                  {fissures.length === 0 && (
                    <p className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                      Aucune fissure détectée. Cliquez sur "Ajouter une fissure" pour en enregistrer.
                    </p>
                  )}
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
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Date de détection</Label>
                          <Input type="date" value={fissure.detectionDate} onChange={(e) => updateFissure(idx, "detectionDate", e.target.value)} />
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
                    </div>
                  ))}
                </div>

                {/* Media Upload */}
                <div className="space-y-2">
                  <Label className="text-base font-display">Médias</Label>
                  <div className="border border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Glissez des photos ou vidéos ici ou utilisez le bouton ci-dessous.</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleMediaChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleMediaClick}
                    >
                      Parcourir les fichiers
                    </Button>
                    {mediaFiles.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {mediaFiles.map((file) => (
                          <span
                            key={file.name + file.lastModified}
                            className="inline-flex items-center px-2 py-1 rounded-full bg-secondary text-xs text-foreground max-w-[160px] truncate"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {mediaPreview && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-1">Aperçu principal :</p>
                        <img
                          src={mediaPreview}
                          alt="Aperçu média inspection"
                          className="mx-auto max-h-40 rounded-md object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Vulnerability Score */}
                {form.monumentId && (
                  <div className="bg-secondary rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Score de vulnérabilité calculé</p>
                      <p className="text-xs text-muted-foreground">Basé sur l'âge du monument et les fissures détectées</p>
                    </div>
                    <VulnerabilityBadge score={vulnScore} size="md" />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <ClipboardCheck className="h-4 w-4 mr-1.5" />Enregistrer l'inspection
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inspectionsData.map((insp) => (
            <InspectionCard key={insp.id} inspection={insp} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
