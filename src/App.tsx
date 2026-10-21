/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, GraduationCap, ShieldCheck } from 'lucide-react';
import { ClearPassProvider, useClearPass } from './context/ClearPassContext';
import { AdminPortal } from './components/admin/AdminPortal';
import { LoginScreen } from './components/mobile/LoginScreen';
import { SchoolLogo } from './components/common/SchoolLogo';
import { MobileAppRootRN } from './react-native/MobileAppRootRN';
import { UserRole } from './types/clearpass';

type AppRoute = 'home' | 'student' | 'personnel' | 'admin';

const routeFromPath = (pathname: string): AppRoute => {
  const route = pathname.replace(/\/+$/, '').toLowerCase();
  if (route === '/student' || route === '/personnel' || route === '/admin') {
    return route.slice(1) as AppRoute;
  }
  return 'home';
};

const RoleSelection: React.FC<{ onSelect: (route: AppRoute) => void }> = ({ onSelect }) => (
  <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-5 py-10 text-slate-900 sm:px-8">
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col items-center justify-center">
      <SchoolLogo size="lg" className="justify-center" />
      <div className="mb-8 mt-5 text-center text-white">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">SIA ClearPass</h1>
        <p className="mt-2 text-sm text-blue-100 sm:text-base">St. Isidore Academy of Trinidad Bohol, Inc.</p>
        <p className="mt-5 text-sm font-medium text-slate-300">Choose your account type to continue</p>
      </div>

      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
        <RoleCard
          title="Student"
          description="View clearance requirements, submit documents, and track your progress."
          Icon={GraduationCap}
          onClick={() => onSelect('student')}
        />
        <RoleCard
          title="Personnel"
          description="Review student submissions, manage assigned requirements, and sign clearances."
          Icon={BriefcaseBusiness}
          onClick={() => onSelect('personnel')}
        />
        <RoleCard
          title="Administrator"
          description="Manage accounts, clearance forms, periods, and school records."
          Icon={ShieldCheck}
          onClick={() => onSelect('admin')}
        />
      </div>
      <p className="mt-8 text-center text-xs text-slate-400">Use the separate sign-in for your assigned role.</p>
    </div>
  </main>
);

const RoleCard: React.FC<{
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}> = ({ title, description, Icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex min-h-52 flex-col rounded-2xl border border-white/15 bg-white p-6 text-left shadow-xl transition hover:-translate-y-1 hover:bg-blue-50 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300"
  >
    <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white shadow-md">
      <Icon className="h-6 w-6" />
    </span>
    <span className="flex w-full items-center justify-between font-bold text-slate-900">
      {title}<ArrowRight className="h-4 w-4 text-blue-900 transition group-hover:translate-x-1" />
    </span>
    <span className="mt-2 text-sm leading-6 text-slate-600">{description}</span>
  </button>
);

const ApplicationRouter: React.FC = () => {
  const { currentUser, logout } = useClearPass();
  const [route, setRoute] = useState<AppRoute>(() => routeFromPath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    const nextPath = nextRoute === 'home' ? '/' : `/${nextRoute}`;
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
    setRoute(nextRoute);
  }, []);

  if (currentUser?.role === 'Administrator') {
    return <AdminPortal onBackToPortal={() => { logout(); navigate('home'); }} />;
  }
  if (currentUser?.role === 'Student' || currentUser?.role === 'Personnel') {
    return <MobileAppRootRN />;
  }

  if (route === 'admin') {
    return <AdminPortal onBackToPortal={() => navigate('home')} />;
  }
  if (route === 'student' || route === 'personnel') {
    const role: UserRole = route === 'student' ? 'Student' : 'Personnel';
    return <LoginScreen key={route} lockedRole={role} onBack={() => navigate('home')} />;
  }

  return <RoleSelection onSelect={navigate} />;
};

export default function App() {
  return (
    <ClearPassProvider>
      <div className="min-h-screen bg-slate-900 font-sans text-slate-100 antialiased">
        <ApplicationRouter />
      </div>
    </ClearPassProvider>
  );
}
