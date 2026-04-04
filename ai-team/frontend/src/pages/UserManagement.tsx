import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Users, Shield, Edit, Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function UserManagement() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<any>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newUserParams, setNewUserParams] = useState({ email: '', full_name: '', password: '', role: 'viewer', organization: '' });

  // Use effect for redirection to avoid "navigate in render body" warning/crash
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers()
      setUsers(data.results || [])
    } catch (err) {
      console.error('Failed to get users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to change this user status?')) return;
    try {
      await adminService.deactivateUser(id)
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert('Failed to change user status')
    }
  }

  const handleUpdateRole = async (id: number, newRole: string) => {
    try {
      await adminService.updateUser(id, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Failed to update role');
    }
  }

  // Double check role before rendering content
  if (isLoading || !user || user.role !== 'admin') {
    return <div className="p-20 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-4" />Checking permissions...</div>;
  }

  if (loading) return <div className="p-20 text-center text-muted-foreground">Loading system users...</div>;

  const roleBadge = (role: string) => {
    if (role === 'admin') return 'bg-primary/10 text-primary';
    if (role === 'authority') return 'bg-amber-600/10 text-amber-500';
    if (role === 'inspector') return 'bg-blue-600/10 text-blue-600';
    return 'bg-muted text-muted-foreground';
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createUser({ ...newUserParams, confirm_password: newUserParams.password });
      setAddModalOpen(false);
      setNewUserParams({ email: '', full_name: '', password: '', role: 'viewer', organization: '' });
      fetchUsers();
    } catch (err: any) {
      alert(`Failed to create user: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-xl border border-border p-6 shadow-2xl relative">
            <h2 className="text-xl font-heading mb-4 text-foreground">Add New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Full Name</label>
                <input required className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={newUserParams.full_name} onChange={e => setNewUserParams({ ...newUserParams, full_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Email</label>
                <input required type="email" className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={newUserParams.email} onChange={e => setNewUserParams({ ...newUserParams, email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Temporary Password</label>
                <input required type="password" minLength={8} className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={newUserParams.password} onChange={e => setNewUserParams({ ...newUserParams, password: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Role</label>
                  <select className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={newUserParams.role} onChange={e => setNewUserParams({ ...newUserParams, role: e.target.value })}>
                    <option value="viewer">Viewer</option>
                    <option value="inspector">Inspector</option>
                    <option value="authority">Authority</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Organization</label>
                  <input className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={newUserParams.organization} onChange={e => setNewUserParams({ ...newUserParams, organization: e.target.value })} />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage system users and permissions</p>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Add User
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Information</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Email</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Role</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Organization</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="text-right px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u, i) => (
                  <tr key={u.id || i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <span className="text-xs font-bold text-primary">
                            {u.full_name
                              ? u.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                              : u.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{u.full_name || 'Unnamed User'}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">ID: #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.id !== user?.id ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className={`text-xs p-1 rounded border border-border bg-background outline-none hover:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all ${roleBadge(u.role)}`}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="inspector">Inspector</option>
                          <option value="authority">Authority</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <Badge className={`${roleBadge(u.role)} capitalize text-xs border-transparent`}>{u.role}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {u.organization || <span className="opacity-30">No organization</span>}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ?
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active
                        </span> :
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Inactive
                        </span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleDeactivate(u.id)}
                            variant="ghost"
                            size="sm"
                            className={u.is_active ? "h-8 w-8 p-0 text-red-400/70 hover:bg-red-500/10 hover:text-red-400" : "h-8 w-8 p-0 text-primary/70 hover:bg-primary/10 hover:text-primary"}
                          >
                            {u.is_active ? <Trash2 className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && !loading && (
            <div className="p-12 text-center text-muted-foreground italic">
              No users found matching your filters.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
