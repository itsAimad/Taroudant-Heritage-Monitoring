import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, Shield, Edit, Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers()
  }, []);

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

  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (loading) return <div className="p-20 text-center text-muted-foreground">Loading...</div>;

  const roleBadge = (role: string) => {
    if (role === 'admin') return 'bg-primary/10 text-primary';
    if (role === 'authority') return 'bg-amber-600/10 text-amber-500';
    if (role === 'inspector') return 'bg-blue-600/10 text-blue-600';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage system users and permissions</p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" /> Add User
          </Button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Organization</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id_user || i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {u.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{u.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${roleBadge(u.role)} capitalize text-xs`}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.organization || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ?
                      <span className="text-safe text-xs bg-safe/10 px-2 py-1 rounded">Active</span> :
                      <span className="text-critical text-xs bg-critical/10 px-2 py-1 rounded">Inactive</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'admin' && (
                      <Button onClick={() => handleDeactivate(u.id_user)} variant="ghost" size="sm" className={u.is_active ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : ""}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
