import React, { useState } from 'react';
import { useClearPass } from '../../context/ClearPassContext';
import {
  Smartphone,
  Maximize2,
  Monitor,
  Code2,
  FolderArchive,
  Shield,
  Users,
} from 'lucide-react';
import { UserRole } from '../../types/clearpass';
import { ExpoProjectExportModal } from './ExpoProjectExportModal';
import { SchoolLogo } from './SchoolLogo';

export const HeaderBanner: React.FC = () => {
  const {
    deviceMode,
    setDeviceMode,
    currentRole,
    currentUser,
    currentPersonnel,
    switchRole,
    logout,
  } = useClearPass();

  const [expoModalOpen, setExpoModalOpen] = useState(false);

  const isWebAdmin = deviceMode === 'admin_web' || currentRole === 'Administrator';

  return (
    <div className="bg-slate-950 text-slate-200 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      {/* Brand & Main Module Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <SchoolLogo size="sm" />
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white text-xs tracking-tight">
              <span>SIA ClearPass</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-1.5 py-0.2 rounded border border-blue-400/30">
                {isWebAdmin ? 'Admin Web' : 'React Native Mobile'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              St. Isidore Academy of Trinidad Bohol, Inc.
            </div>
          </div>
        </div>

        {/* Primary Platform Switcher: Mobile App vs Admin Web Portal */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setDeviceMode('mobile');
              if (currentRole === 'Administrator') {
                switchRole('Student');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isWebAdmin
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App (Students & Personnel)</span>
          </button>

          <button
            onClick={() => {
              setDeviceMode('admin_web');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isWebAdmin
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Admin Web Portal (Account Creation)</span>
          </button>
        </div>
      </div>

      {/* Secondary Controls: Mobile Device Mode, Quick Role, ZIP Download */}
      <div className="flex flex-wrap items-center gap-2">
        {/* If in Mobile App, allow switching shell or role */}
        {!isWebAdmin && (
          <>
            <div className="flex items-center bg-slate-900 px-1 py-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                  deviceMode === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Phone Frame"
              >
                Simulator
              </button>
              <button
                onClick={() => setDeviceMode('responsive')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                  deviceMode === 'responsive' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Full Screen Phone"
              >
                Fullscreen
              </button>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-semibold text-slate-200">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded font-bold border border-blue-800">
                    {currentRole === 'Student' ? 'Student' : currentPersonnel?.office || 'Personnel'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold pl-1.5 border-l border-slate-700 cursor-pointer"
                  title="Sign out of Mobile App"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                Signed Out
              </div>
            )}
          </>
        )}

        {/* 1-Click ZIP Download Button */}
        <button
          onClick={() => setExpoModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition-colors cursor-pointer"
          title="Download Project ZIP and Run Guide"
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Download ZIP</span>
        </button>

        {/* Expo / React Native Source Viewer */}
        <button
          onClick={() => setExpoModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/40 rounded-lg transition-colors cursor-pointer"
          title="View React Native & Expo Source Code"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">React Native Code</span>
        </button>

      </div>

      {/* Expo Code Viewer & Download Modal */}
      <ExpoProjectExportModal
        isOpen={expoModalOpen}
        onClose={() => setExpoModalOpen(false)}
      />
    </div>
  );
};
