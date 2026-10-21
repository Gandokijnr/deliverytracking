import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { Shield, Menu, X, Package, Phone } from 'lucide-react';
import { useState } from 'react';
import { classNames } from '@/lib/tracking';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Our Services' },
  { to: '/track', label: 'Track Shipment' },
  { to: '/about', label: 'About Us' },
  { to: '/support', label: 'Contact Support' },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-[#0c1a33] text-white shadow-lg">
        <div className="container-mx">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
              <div className="w-10 h-10 rounded-lg bg-[#c9a227] flex items-center justify-center transition-transform group-hover:scale-105">
                <Shield className="w-6 h-6 text-[#0c1a33]" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold tracking-tight">MeridianVault</span>
                <span className="text-[10px] text-[#c9a227] uppercase tracking-widest font-medium">Secure Logistics</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={classNames(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    pathname === link.to
                      ? 'text-[#c9a227] bg-white/5'
                      : 'text-slate-200 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <Link to="/track" className="btn-primary !py-2 !px-5 !text-sm">
                <Package className="w-4 h-4" />
                Track Now
              </Link>
            </div>

            <button
              className="lg:hidden p-2 text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden border-t border-white/10 bg-[#0c1a33] animate-slide-in">
            <div className="container-mx py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={classNames(
                    'px-4 py-3 text-sm font-medium rounded-lg transition-all',
                    pathname === link.to
                      ? 'text-[#c9a227] bg-white/5'
                      : 'text-slate-200 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/support" onClick={() => setMobileOpen(false)} className="btn-primary mt-2 !w-full">
                <Phone className="w-4 h-4" />
                Contact Support
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-[#0c1a33] text-slate-300">
        <div className="container-mx py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#c9a227] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#0c1a33]" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-bold text-white">MeridianVault</span>
                  <span className="text-[10px] text-[#c9a227] uppercase tracking-widest">Secure Logistics</span>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Specialized secure transportation of high-value assets across international destinations.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Services</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/services" className="hover:text-[#c9a227] transition-colors">Cash & Banknote Logistics</Link></li>
                <li><Link to="/services" className="hover:text-[#c9a227] transition-colors">Gold & Precious Metals</Link></li>
                <li><Link to="/services" className="hover:text-[#c9a227] transition-colors">Diamond & Jewelry</Link></li>
                <li><Link to="/services" className="hover:text-[#c9a227] transition-colors">Luxury Asset Transport</Link></li>
                <li><Link to="/services" className="hover:text-[#c9a227] transition-colors">Secure Cargo Logistics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/about" className="hover:text-[#c9a227] transition-colors">About Us</Link></li>
                <li><Link to="/track" className="hover:text-[#c9a227] transition-colors">Track Shipment</Link></li>
                <li><Link to="/support" className="hover:text-[#c9a227] transition-colors">Contact Support</Link></li>
                <li><Link to="/auth" className="hover:text-[#c9a227] transition-colors">Administrator Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>Secure Operations Center</li>
                <li>24/7 Monitoring Available</li>
                <li>International Service Coverage</li>
                <li className="pt-2">
                  <Link to="/support" className="text-[#c9a227] hover:underline">Contact Support Team</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} MeridianVault Secure Logistics. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Illustrative route data is not live GPS tracking. Verified events appear in checkpoint history.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
