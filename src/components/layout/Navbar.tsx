import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = location.pathname === '/';

  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/heritage', label: 'Heritage Explorer' },
    { to: '/about', label: 'About' },
  ];

  const authLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/risk-lab', label: 'Risk Lab' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/architecture', label: 'Architecture' },
  ];

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
            {publicLinks.map(l => (
              <Link key={l.to} to={l.to} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === l.to ? (isHome ? 'text-copper-light' : 'text-primary') : (isHome ? 'text-sand/70 hover:text-sand' : 'text-muted-foreground hover:text-foreground')}`}>
                {l.label}
              </Link>
            ))}
            {isAuthenticated && authLinks.map(l => (
              <Link key={l.to} to={l.to} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === l.to ? (isHome ? 'text-copper-light' : 'text-primary') : (isHome ? 'text-sand/70 hover:text-sand' : 'text-muted-foreground hover:text-foreground')}`}>
                {l.label}
              </Link>
            ))}
            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/users" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/users' ? (isHome ? 'text-copper-light' : 'text-primary') : (isHome ? 'text-sand/70 hover:text-sand' : 'text-muted-foreground hover:text-foreground')}`}>
                Users
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Badge className={`${roleBadgeColor} text-xs`}>{user.role}</Badge>
                <span className={`text-sm ${isHome ? 'text-sand/80' : 'text-muted-foreground'}`}>{user.name.split(' ')[0]}</span>
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
            {publicLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-sm ${isHome ? 'text-sand' : 'text-foreground'}`}>{l.label}</Link>
            ))}
            {isAuthenticated && authLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-sm ${isHome ? 'text-sand' : 'text-foreground'}`}>{l.label}</Link>
            ))}
            {isAuthenticated ? (
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md text-sm ${isHome ? 'text-sand' : 'text-foreground'}`}>Logout</button>
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
