import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileUp,
  FileText,
  Package,
  TrendingUp,
  MessageSquare,
  Bell,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Upload Invoice', icon: FileUp, href: '/upload' },
  { label: 'Invoices', icon: FileText, href: '/invoices' },
  { label: 'Inventory', icon: Package, href: '/inventory' },
  { label: 'GST Reports', icon: TrendingUp, href: '/gst-reports' },
  { label: 'Analytics', icon: TrendingUp, href: '/analytics' },
  { label: 'Chatbot', icon: MessageSquare, href: '/chatbot' },
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border md:hidden h-16 flex items-center px-4 shadow-glow-violet">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            
            <span className="font-bold text-sidebar-foreground gradient-text">Tax Saathi</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-sidebar-foreground hover:bg-primary/10"
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-30 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 shadow-glow-violet',
          collapsed ? 'w-20' : 'w-64',
          'hidden md:flex flex-col'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border bg-gradient-to-r from-primary/5 to-accent/5">
          {!collapsed && (
            <div className="flex items-center gap-2">
              
              <span className="text-2xl font-bold gradient-text"><pre>  Tax Saathi</pre></span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-primary/10"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} to={item.href}>
                  <div
                    className={cn(
                      'sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
                      active
                        ? 'sidebar-active text-primary font-medium'
                        : 'text-sidebar-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-primary'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', active ? 'text-primary' : 'text-sidebar-foreground')} />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-glow">
                <span className="text-sm font-bold text-white">{initials}</span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground">{displayName}</p>
                  <p className="text-xs text-sidebar-foreground opacity-70 truncate">
                    {displayEmail}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-1 px-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-primary rounded-lg transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                {!collapsed && <span className="text-sm font-medium">Logout</span>}
              </button>
            </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed left-0 top-16 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-20 transition-transform duration-300 shadow-glow-violet',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <div
                  className={cn(
                    'sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300',
                    active
                      ? 'sidebar-active text-primary font-medium'
                      : 'text-sidebar-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-primary'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', active ? 'text-primary' : 'text-sidebar-foreground')} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
