import { useState, useEffect } from 'react';
import { monumentService, Monument } from '../../services/monumentService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, MapPin, Plus, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function MonumentManagement() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    construction_year: '',
    latitude: '',
    longitude: '',
    category_id: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMonuments();
    }
  }, [user]);

  const fetchMonuments = async () => {
    try {
      setLoading(true);
      const data = await monumentService.getAll();
      setMonuments(data.results || []);
    } catch (err) {
      console.error('Failed to get monuments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: '', location: '', description: '', construction_year: '', latitude: '', longitude: '', category_id: '' });
    setFile(null);
    setFilePreview(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Monument) => {
    setIsEditing(true);
    setEditId(m.id);
    setFormData({
      name: m.name,
      location: m.location,
      description: m.description || '',
      construction_year: m.construction_year ? String(m.construction_year) : '',
      latitude: m.latitude ? String(m.latitude) : '',
      longitude: m.longitude ? String(m.longitude) : '',
      category_id: '' // If category fetching is not implemented, leave it as is or expand if needed.
    });
    setFile(null);
    setFilePreview(m.image_url ? monumentService.getMonumentPhotoUrl(m.id) : null);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this monument? This action cannot be undone.')) return;
    try {
      await monumentService.delete(id);
      fetchMonuments();
    } catch (err) {
      console.error(err);
      alert('Failed to delete monument.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editId) {
        await monumentService.update(editId, formData, file);
      } else {
        await monumentService.create(formData, file);
      }
      setModalOpen(false);
      fetchMonuments();
    } catch (err: any) {
      alert(`Operation failed: ${err.message || 'Unknown error'}`);
    }
  };

  if (isLoading || !user || user.role !== 'admin') {
    return <div className="p-20 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-4" />Checking permissions...</div>;
  }

  if (loading) return <div className="p-20 text-center text-muted-foreground">Loading monuments...</div>;

  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-xl rounded-xl border border-border p-6 shadow-2xl relative my-8">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-heading mb-4 text-foreground">{isEditing ? 'Edit Monument' : 'Add New Monument'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Name</label>
                  <input required className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Location</label>
                  <input required className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Construction Year</label>
                  <input type="number" className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={formData.construction_year} onChange={e => setFormData({ ...formData, construction_year: e.target.value })} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Latitude</label>
                  <input type="number" step="any" required className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: e.target.value })} />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Longitude</label>
                  <input type="number" step="any" required className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Description</label>
                  <textarea rows={3} className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:ring-1" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Monument Photo</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 mb-2" />
                  {filePreview && (
                    <div className="mt-2 w-full max-w-[200px] rounded overflow-hidden border border-border">
                      <img src={filePreview} alt="Preview" className="w-full h-auto object-cover aspect-video" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">{isEditing ? 'Save Changes' : 'Create Monument'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-foreground">Monument Management</h1>
            <p className="text-muted-foreground mt-1">Add, update, and remove monitored structures</p>
          </div>
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add Monument
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Monument</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Location</th>
                  <th className="text-left px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Status / Risk</th>
                  <th className="text-right px-6 py-4 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monuments.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {m.image_url ? (
                          <div className="h-12 w-16 rounded overflow-hidden shadow-sm shrink-0 border border-border">
                            <img src={monumentService.getMonumentPhotoUrl(m.id)} alt={m.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-16 rounded bg-muted flex items-center justify-center shrink-0 border border-border">
                            <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-foreground">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">ID: #{m.id} &bull; Year: {m.construction_year || 'Unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-muted-foreground text-xs gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {m.location}
                      </div>
                      <div className="text-[10px] text-muted-foreground/70 font-mono mt-1">
                        {m.latitude?.toFixed(4)}, {m.longitude?.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        <Badge className="bg-primary/10 text-primary capitalize text-[10px] hover:bg-primary/20 hover:text-primary transition-colors border-transparent">
                          {m.status.replace('_', ' ')}
                        </Badge>
                        {m.vulnerability_score !== null && (
                          <div className="text-[10px] flex items-center gap-1.5 font-medium">
                            <span className="text-muted-foreground">Score:</span>
                            <span className={m.vulnerability_score > 60 ? 'text-red-500' : m.vulnerability_score > 30 ? 'text-amber-500' : 'text-emerald-500'}>
                              {m.vulnerability_score}/100
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleOpenEdit(m)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-primary/70 hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(m.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500/70 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {monuments.length === 0 && !loading && (
            <div className="p-12 text-center text-muted-foreground italic">
              No monuments tracked yet. Check back later or add one above.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
