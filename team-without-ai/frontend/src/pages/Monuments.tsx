import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { VulnerabilityBadge } from "@/components/VulnerabilityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Monument } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, ClipboardCheck, MapPin, Calendar, Pencil, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Monuments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "Admin";
  const canInspect = user?.role === "Expert";

  const [monumentsData, setMonumentsData] = useState<Monument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMonument, setEditMonument] = useState<Monument | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", location: "", dateCreation: "", description: "", structuralState: "" as Monument["structuralState"], vulnerabilityScore: "" });
  const [addForm, setAddForm] = useState({
    name: "",
    location: "",
    dateCreation: "",
    description: "",
    structuralState: "Stable" as Monument["structuralState"],
    image: "",
  });
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

  const authHeaders = () => {
    const token = localStorage.getItem("ths_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/monuments`, {
          headers: {
            ...authHeaders(),
          },
        });
        if (!res.ok) throw new Error("Impossible de charger les monuments.");
        const data = await res.json();
        setMonumentsData(data);
      } catch (e) {
        console.error(e);
        toast({ title: "Erreur", description: "Chargement des monuments échoué.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (m: Monument) => {
    setEditForm({
      name: m.name, location: m.location, dateCreation: m.dateCreation,
      description: m.description, structuralState: m.structuralState,
      vulnerabilityScore: String(m.vulnerabilityScore),
    });
    setEditMonument(m);
  };

  const resetAddForm = () => {
    setAddForm({
      name: "",
      location: "",
      dateCreation: "",
      description: "",
      structuralState: "Stable",
      image: "",
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/monuments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: addForm.name,
          location: addForm.location,
          dateCreation: addForm.dateCreation,
          structuralState: addForm.structuralState,
          description: addForm.description,
          image: addForm.image,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();
      setMonumentsData((prev) => [created, ...prev]);
      setShowAdd(false);
      resetAddForm();
      toast({ title: "Monument ajouté", description: `${created.name} a été créé avec succès.` });
    } catch {
      toast({ title: "Erreur", description: "Création impossible.", variant: "destructive" });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMonument) return;
    try {
      const monumentId = editMonument.id.replace(/^m/, "");
      const res = await fetch(`${API_BASE}/monuments/${monumentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: editForm.name,
          location: editForm.location,
          dateCreation: editForm.dateCreation,
          structuralState: editForm.structuralState,
          description: editForm.description,
          image: editMonument.image,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setMonumentsData((prev) => prev.map((m) => (m.id === editMonument.id ? updated : m)));
      setEditMonument(null);
      toast({ title: "Monument modifié", description: `${editForm.name} a été mis à jour.` });
    } catch {
      toast({ title: "Erreur", description: "Modification impossible.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const name = monumentsData.find((m) => m.id === deleteId)?.name;
    try {
      const monumentId = deleteId.replace(/^m/, "");
      const res = await fetch(`${API_BASE}/monuments/${monumentId}`, {
        method: "DELETE",
        headers: {
          ...authHeaders(),
        },
      });
      if (!res.ok) throw new Error("Delete failed");
      setMonumentsData((prev) => prev.filter((m) => m.id !== deleteId));
      setDeleteId(null);
      toast({ title: "Monument supprimé", description: `${name} a été retiré.`, variant: "destructive" });
    } catch {
      toast({ title: "Erreur", description: "Suppression impossible.", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Monuments</h2>
            <p className="text-sm text-muted-foreground">Patrimoine historique sous surveillance</p>
          </div>
          {isAdmin && (
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => {
                resetAddForm();
                setShowAdd(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Ajouter un monument
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement des monuments...</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {monumentsData.map((m) => (
            <div key={m.id} className="bg-card border rounded-lg overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                {m.image ? (
                  <img
                    src={m.image}
                    alt={m.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary" />
                )}
                <div className="absolute top-3 right-3">
                  <VulnerabilityBadge score={m.vulnerabilityScore} size="md" />
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-lg font-semibold text-foreground">{m.name}</h3>
                  <StatusBadge status={m.structuralState} />
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{m.location}</p>
                  <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{m.dateCreation}</p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/monuments/${m.id}`)}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" />Détails
                  </Button>
                  {canInspect && (
                    <Button
                      size="sm"
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => navigate(`/inspections/new?monument=${m.id}`)}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />Inspecter
                    </Button>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(m)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />Modifier
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => setDeleteId(m.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />Supprimer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Ajouter un monument</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Localisation</Label>
                <Input value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Date de création</Label>
                <Input type="date" value={addForm.dateCreation} onChange={(e) => setAddForm({ ...addForm, dateCreation: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>État structurel</Label>
              <Select value={addForm.structuralState} onValueChange={(v) => setAddForm({ ...addForm, structuralState: v as Monument["structuralState"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="À surveiller">À surveiller</SelectItem>
                  <SelectItem value="Critique">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Image (URL optionnelle)</Label>
              <Input value={addForm.image} onChange={(e) => setAddForm({ ...addForm, image: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Créer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editMonument} onOpenChange={(o) => !o && setEditMonument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Modifier le monument</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Localisation</Label>
                <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Date de création</Label>
                <Input type="date" value={editForm.dateCreation} onChange={(e) => setEditForm({ ...editForm, dateCreation: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>État structurel</Label>
                <Select value={editForm.structuralState} onValueChange={(v) => setEditForm({ ...editForm, structuralState: v as Monument["structuralState"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stable">Stable</SelectItem>
                    <SelectItem value="À surveiller">À surveiller</SelectItem>
                    <SelectItem value="Critique">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Score vulnérabilité</Label>
                <Input type="number" min="0" max="100" value={editForm.vulnerabilityScore} onChange={(e) => setEditForm({ ...editForm, vulnerabilityScore: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditMonument(null)}>Annuler</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le monument sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
