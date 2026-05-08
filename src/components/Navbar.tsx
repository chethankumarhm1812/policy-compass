import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, User, LogOut, Bell, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/policies', label: 'Policies' },
    { to: '/deatils', label: 'Deatils' },
    { to: '/chat', label: 'AI Assistant' },
  ];

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-heading text-foreground">PolicyLens AI</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}>
              <Button variant={isActive(l.to) ? 'default' : 'ghost'} size="sm">{l.label}</Button>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/notifications">
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut}><LogOut className="h-5 w-5" /></Button>
        </div>

        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-2 animate-fade-in">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}>
              <Button variant={isActive(l.to) ? 'default' : 'ghost'} className="w-full justify-start">{l.label}</Button>
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link to="/profile" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="sm"><User className="mr-2 h-4 w-4" /> Profile</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" /> Sign Out</Button>
          </div>
        </div>
      )}
    </nav>
  );
}
