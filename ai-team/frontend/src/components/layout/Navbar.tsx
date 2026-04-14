import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, Menu, X, LogOut, User, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/services/adminService';
import { notificationService } from '@/services/notificationService';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isHome = location.pathname === '/';

  const commonLinks = [
    { to: '/monuments', label: 'Monuments' },
  ];

  const publicOnlyLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
  ];

  const authLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/risk-lab', label: 'Risk Lab', roles: ['admin', 'inspector', 'authority'] },
    { to: '/analytics', label: 'Analytics' },
  ];

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'authority')) {
      const fetchCounts = async () => {
        try {
          // Fetch system notifications
          const notifsData = await notificationService.getAll();
          const unreadNotifs = notifsData.results?.filter((n: any) => !n.is_read).length || 0;
          
          let pendingReqs = 0;
          // For admins, also count pending access requests
          if (user?.role === 'admin') {
            const reqsData = await adminService.getAccessRequests('pending');
            pendingReqs = reqsData.results?.length || 0;
          }
          
          setUnreadCount(unreadNotifs + pendingReqs);
        } catch (err) {
          console.error('Failed to fetch notification counts:', err);
        }
      };
      
      fetchCounts();
    }
  }, [isAuthenticated, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleBadgeColor = user?.role === 'admin' ? 'bg-primary text-primary-foreground' : user?.role === 'inspector' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${isHome ? 'bg-charcoal/80 backdrop-blur-md' : 'bg-background/95 backdrop-blur-md border-b border-border'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className={`h-6 w-6 ${isHome ? 'text-copper-light' : 'text-primary'}`} />
            <span className={`font-heading font-semibold text-lg ${isHome ? 'text-sand' : 'text-foreground'}`}>
              Taroudant Heritage Shield
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {!isAuthenticated && publicOnlyLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm transition-colors ${isActive
                    ? 'text-copper-light font-medium'
                    : (isHome ? 'text-sand/60 hover:text-sand font-medium' : 'text-muted-foreground hover:text-foreground font-medium')
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {commonLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm transition-colors ${isActive
                    ? 'text-copper-light font-medium'
                    : (isHome ? 'text-sand/60 hover:text-sand font-medium' : 'text-muted-foreground hover:text-foreground font-medium')
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {isAuthenticated && authLinks
              .filter(l => !(l as any).roles || ((l as any).roles.includes(user?.role)))
              .map(l => (
                <Link key={l.to} to={l.to} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === l.to ? (isHome ? 'text-copper-light' : 'text-primary') : (isHome ? 'text-sand/70 hover:text-sand' : 'text-muted-foreground hover:text-foreground')}`}>
                  {l.label}
                </Link>
              ))}
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <Link to="/admin/users" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/admin/users' ? (isHome ? 'text-copper-light' : 'text-primary') : (isHome ? 'text-sand/70 hover:text-sand' : 'text-muted-foreground hover:text-foreground')}`}>
                  Users
                </Link>
                <Link to="/admin/monuments" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/admin/monuments' ? (isHome ? 'text-copper-light' : 'text-primary') : (isHome ? 'text-sand/70 hover:text-sand' : 'text-muted-foreground hover:text-foreground')}`}>
                  Manage Monuments
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {(user.role === 'admin' || user.role === 'authority') && (
                  <Link to="/dashboard" className="relative p-2 text-sand/70 hover:text-copper-light transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-stone-950"></span>
                    )}
                  </Link>
                )}
                <Badge className={`${roleBadgeColor} text-xs uppercase`}>{user.role}</Badge>
                <span className={`text-sm font-medium ${isHome ? 'text-sand/90' : 'text-foreground'}`}>
                  {user.full_name ? user.full_name.split(' ')[0] : (user.email.split('@')[0] || 'User')}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className={isHome ? 'text-sand/70 hover:text-sand' : ''}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant={isHome ? 'outline' : 'default'} size="sm" className={isHome ? 'border-copper-light text-copper-light hover:bg-copper-light/10' : ''}>
                  <User className="h-4 w-4 mr-2" /> Enter System
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className={`h-6 w-6 ${isHome ? 'text-sand' : 'text-foreground'}`} /> : <Menu className={`h-6 w-6 ${isHome ? 'text-sand' : 'text-foreground'}`} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`md:hidden ${isHome ? 'bg-charcoal/95' : 'bg-background/95'} backdrop-blur-md border-t border-border`}>
          <div className="px-4 py-3 space-y-1">
            {!isAuthenticated && publicOnlyLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm ${isActive
                    ? 'text-copper-light font-medium bg-black/10'
                    : (isHome ? 'text-sand' : 'text-foreground')
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {commonLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm ${isActive
                    ? 'text-copper-light font-medium bg-black/10'
                    : (isHome ? 'text-sand' : 'text-foreground')
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {isAuthenticated && authLinks
              .filter(l => !(l as any).roles || ((l as any).roles.includes(user?.role)))
              .map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-sm ${isHome ? 'text-sand' : 'text-foreground'}`}>{l.label}</Link>
              ))}
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/users" onClick={() => setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-sm ${isHome ? 'text-sand' : 'text-foreground'}`}>Users</Link>
                    <Link to="/admin/monuments" onClick={() => setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-sm ${isHome ? 'text-sand' : 'text-foreground'}`}>Manage Monuments</Link>
                  </>
                )}
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md text-sm ${isHome ? 'text-sand' : 'text-foreground'}`}>Logout</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-sm ${isHome ? 'text-copper-light' : 'text-primary'}`}>Enter System</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
