import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { utilisateurs as initialUsers, Utilisateur } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "Admin";

  const [users, setUsers] = useState<Utilisateur[]>(initialUsers);
  const [editUser, setEditUser] = useState<Utilisateur | null>(null);
  const [deleteUser, setDeleteUser] = useState<Utilisateur | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<Utilisateur["role"]>("Expert");
  const [formStatus, setFormStatus] = useState<Utilisateur["status"]>("Actif");

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormRole("Expert");
    setFormStatus("Actif");
  };

  const openEdit = (u: Utilisateur) => {
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormStatus(u.status);
    setEditUser(u);
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    setUsers(prev =>
      prev.map(u => u.id === editUser.id ? { ...u, name: formName, email: formEmail, role: formRole, status: formStatus } : u)
    );
    setEditUser(null);
    resetForm();
    toast({ title: "Utilisateur modifié", description: `${formName} a été mis à jour.` });
  };

  const handleDelete = () => {
    if (!deleteUser) return;
    setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
    toast({ title: "Utilisateur supprimé", description: `${deleteUser.name} a été supprimé.`, variant: "destructive" });
    setDeleteUser(null);
  };

  const handleAdd = () => {
    const newUser: Utilisateur = {
      id: `u${Date.now()}`,
      name: formName,
      email: formEmail,
      role: formRole,
      status: formStatus,
      lastLogin: "—",
    };
    setUsers(prev => [...prev, newUser]);
    setShowAdd(false);
    resetForm();
    toast({ title: "Utilisateur ajouté", description: `${formName} a été créé avec le rôle ${formRole}.` });
  };

  const userForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nom</Label>
        <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nom complet" />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@exemple.ma" />
      </div>
      <div className="space-y-2">
        <Label>Rôle</Label>
        <Select value={formRole} onValueChange={v => setFormRole(v as Utilisateur["role"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Expert">Expert</SelectItem>
            <SelectItem value="Authority">Authority</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Statut</Label>
        <Select value={formStatus} onValueChange={v => setFormStatus(v as Utilisateur["status"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Actif">Actif</SelectItem>
            <SelectItem value="Inactif">Inactif</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Utilisateurs</h2>
            <p className="text-sm text-muted-foreground">Gestion des comptes utilisateurs</p>
          </div>
          {isAdmin && (
            <Button onClick={() => { resetForm(); setShowAdd(true); }} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Ajouter un utilisateur
            </Button>
          )}
        </div>

        <div className="bg-card border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><StatusBadge status={u.role} /></TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell>{u.lastLogin}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteUser(u)}>
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
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
          </DialogHeader>
          {userForm}
          <Button onClick={handleAdd} disabled={!formName || !formEmail} className="w-full mt-2">
            Créer l'utilisateur
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {userForm}
          <Button onClick={handleSaveEdit} disabled={!formName || !formEmail} className="w-full mt-2">
            Enregistrer
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={open => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'utilisateur <strong>{deleteUser?.name}</strong> sera définitivement supprimé. Cette action est irréversible.
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
