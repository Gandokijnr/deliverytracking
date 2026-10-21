import { createHashHistory, createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import PublicLayout from '@/layouts/PublicLayout';

const HomePage = lazy(() => import('@/pages/public/Home'));
const ServicesPage = lazy(() => import('@/pages/public/Services'));
const AboutPage = lazy(() => import('@/pages/public/About'));
const TrackPage = lazy(() => import('@/pages/public/Track'));
const SupportPage = lazy(() => import('@/pages/public/Support'));
const AuthPage = lazy(() => import('@/pages/admin/Auth'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminShipments = lazy(() => import('@/pages/admin/Shipments'));
const AdminShipmentNew = lazy(() => import('@/pages/admin/ShipmentNew'));
const AdminShipmentDetail = lazy(() => import('@/pages/admin/ShipmentDetail'));
const AdminSupport = lazy(() => import('@/pages/admin/Support'));

function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-[#c9a227] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public',
  component: PublicLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/',
  component: () => <Suspense fallback={<Loading />}><HomePage /></Suspense>,
});

const servicesRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/services',
  component: () => <Suspense fallback={<Loading />}><ServicesPage /></Suspense>,
});

const aboutRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/about',
  component: () => <Suspense fallback={<Loading />}><AboutPage /></Suspense>,
});

const trackRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/track',
  component: () => <Suspense fallback={<Loading />}><TrackPage /></Suspense>,
});

const supportRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/support',
  component: () => <Suspense fallback={<Loading />}><SupportPage /></Suspense>,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: () => <Suspense fallback={<Loading />}><AuthPage /></Suspense>,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin',
  component: () => <Suspense fallback={<Loading />}><AdminLayout /></Suspense>,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin',
  component: () => <Suspense fallback={<Loading />}><AdminDashboard /></Suspense>,
});

const adminShipmentsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/shipments',
  component: () => <Suspense fallback={<Loading />}><AdminShipments /></Suspense>,
});

const adminProgressRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/shipment-progress',
  component: () => <Suspense fallback={<Loading />}><AdminShipments progressMode /></Suspense>,
});

const adminShipmentNewRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/shipments/new',
  component: () => <Suspense fallback={<Loading />}><AdminShipmentNew /></Suspense>,
});

const adminShipmentDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/shipments/$id',
  component: () => <Suspense fallback={<Loading />}><AdminShipmentDetail /></Suspense>,
});

const adminSupportRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/support',
  component: () => <Suspense fallback={<Loading />}><AdminSupport /></Suspense>,
});

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([
    homeRoute,
    servicesRoute,
    aboutRoute,
    trackRoute,
    supportRoute,
  ]),
  authRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminShipmentsRoute,
    adminProgressRoute,
    adminShipmentNewRoute,
    adminShipmentDetailRoute,
    adminSupportRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
