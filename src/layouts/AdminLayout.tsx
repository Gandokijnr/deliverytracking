import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { Shield, LayoutDashboard, Package, MessageSquare, LogOut, Menu, X, Home } from 'lucide-react';
import { classNames } from '@/lib/tracking';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/shipments', label: 'Shipments', icon: Package },
  { to: '/admin/shipment-progress', label: 'Shipment Progress', icon: Package },
  { to: '/admin/support', label: 'Support', icon: MessageSquare },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [session, setSession] = useState<unknown>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        navigate({ to: '/auth' });
      } else {
        setSession(data.session);
        setChecking(false);
      }
    }).catch(() => {
      navigate({ to: '/auth' });
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!sess) {
        navigate({ to: '/auth' });
      } else {
        setSession(sess);
        setChecking(false);
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_type', 'customer')
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    const channel = supabase
      .channel('admin-unread-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: 'sender_type=eq.customer' }, fetchUnread)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_messages' }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/auth' });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0c1a33] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className={classNames(
        'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0c1a33] text-white flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <div className="p-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-10 h-10 rounded-lg bg-[#c9a227] flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#0c1a33]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold">MeridianVault</span>
              <span className="text-[10px] text-[#c9a227] uppercase tracking-widest">Admin Panel</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                pathname === item.to
                  ? 'bg-[#c9a227] text-[#0c1a33]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.to === '/admin/support' && unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">{unreadCount}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all">
            <Home className="w-5 h-5" />
            View Public Site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="px-4 lg:px-8 h-16 flex items-center justify-between">
            <button className="lg:hidden p-2 text-[#0c1a33]" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-lg font-bold text-[#0c1a33] hidden lg:block">
              {adminNav.find((n) => pathname.startsWith(n.to))?.label || 'Admin'}
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500 hidden sm:block">Administrator</span>
              <div className="w-8 h-8 rounded-full bg-[#112342] flex items-center justify-center text-[#c9a227] font-bold text-xs">
                AD
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
