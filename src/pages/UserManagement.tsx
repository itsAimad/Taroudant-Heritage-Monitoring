import { useState } from 'react';
import { MOCK_USERS } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, Shield, Edit, Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const UserManagement = () => {
  const { user } = useAuth();
  const [users] = useState(MOCK_USERS);

  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const roleBadge = (role: string) => {
    if (role === 'admin') return 'bg-primary/10 text-primary';
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
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Last Active</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.username} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{u.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><Badge className={`${roleBadge(u.role)} capitalize text-xs`}>{u.role}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.lastActive}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
};

export default UserManagement;
