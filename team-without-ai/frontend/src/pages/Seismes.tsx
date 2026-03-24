import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { seismes as initialSeismes, Seisme } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export default function Seismes() {
  const { user } = useAuth();
  const [seismesData, setSeismesData] = useState<Seisme[]>(initialSeismes);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", location: "", magnitude: "", depth: "", intensity: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newSeisme: Seisme = {
      id: `s${Date.now()}`,
      date: form.date,
      location: form.location,
      magnitude: parseFloat(form.magnitude),
      depth: parseFloat(form.depth),
      intensity: form.intensity,
    };
    setSeismesData([newSeisme, ...seismesData]);
    setForm({ date: "", location: "", magnitude: "", depth: "", intensity: "" });
    setOpen(false);
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
        </div>

        <div className="bg-card border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Magnitude</TableHead>
                <TableHead>Profondeur</TableHead>
                <TableHead>Intensité</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
