import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Seisme } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export default function Seismes() {
  const { user } = useAuth();
  const [seismesData, setSeismesData] = useState<Seisme[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", location: "", magnitude: "", depth: "", intensity: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [editForm, setEditForm] = useState({ date: "", location: "", magnitude: "", depth: "", intensity: "" });
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

  const authHeaders = () => {
    const token = localStorage.getItem("ths_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const numericSeismeId = (sid: string) => sid.replace(/^s/, "");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/seismes`, { headers: { ...authHeaders() } });
        if (!res.ok) throw new Error("Impossible de charger les séismes");
        const data = await res.json();
        setSeismesData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/seismes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          date: form.date,
          location: form.location,
          magnitude: parseFloat(form.magnitude),
          depth: parseFloat(form.depth),
          intensity: form.intensity,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();
      setSeismesData((prev) => [created, ...prev]);
      setForm({ date: "", location: "", magnitude: "", depth: "", intensity: "" });
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditOpen = (s: Seisme) => {
    setEditId(s.id);
    setEditForm({
      date: s.date,
      location: s.location,
      magnitude: String(s.magnitude),
      depth: String(s.depth),
      intensity: s.intensity,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idNum = numericSeismeId(editId);
      const res = await fetch(`${API_BASE}/seismes/${idNum}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          date: editForm.date,
          location: editForm.location,
          magnitude: parseFloat(editForm.magnitude),
          depth: parseFloat(editForm.depth),
          intensity: editForm.intensity,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setSeismesData((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (s: Seisme) => {
    const ok = window.confirm(`Supprimer le séisme du ${s.date} (${s.location}) ?`);
    if (!ok) return;

    try {
      const idNum = numericSeismeId(s.id);
      const res = await fetch(`${API_BASE}/seismes/${idNum}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error("Delete failed");
      setSeismesData((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Séismes</h2>
            <p className="text-sm text-muted-foreground">Registre des événements sismiques</p>
          </div>
          {user?.role === "Admin" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-1.5" />Nouveau séisme
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Enregistrer un séisme</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Localisation</Label>
                      <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Magnitude</Label>
                      <Input type="number" step="0.1" value={form.magnitude} onChange={(e) => setForm({ ...form, magnitude: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Profondeur (km)</Label>
                      <Input type="number" step="0.1" value={form.depth} onChange={(e) => setForm({ ...form, depth: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Intensité</Label>
                    <Input value={form.intensity} onChange={(e) => setForm({ ...form, intensity: e.target.value })} placeholder="Ex: VI (Forte)" required />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Enregistrer</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {user?.role === "Admin" && (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Modifier un séisme</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Localisation</Label>
                      <Input
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Magnitude</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.magnitude}
                        onChange={(e) => setEditForm({ ...editForm, magnitude: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Profondeur (km)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.depth}
                        onChange={(e) => setEditForm({ ...editForm, depth: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Intensité</Label>
                    <Input
                      value={editForm.intensity}
                      onChange={(e) => setEditForm({ ...editForm, intensity: e.target.value })}
                      placeholder="Ex: VI (Forte)"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement des séismes...</p>
        ) : (
        <div className="bg-card border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Magnitude</TableHead>
                <TableHead>Profondeur</TableHead>
                <TableHead>Intensité</TableHead>
                    {user?.role === "Admin" && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {seismesData.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.date}</TableCell>
                  <TableCell>{s.location}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${s.magnitude >= 5 ? "text-critical" : s.magnitude >= 4 ? "text-warning" : "text-foreground"}`}>
                      {s.magnitude}
                    </span>
                  </TableCell>
                  <TableCell>{s.depth} km</TableCell>
                  <TableCell>{s.intensity}</TableCell>
                  {user?.role === "Admin" && (
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEditOpen(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(s)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
