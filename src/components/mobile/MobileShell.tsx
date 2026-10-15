import React, { useState, useEffect } from 'react';
import {
  Wifi,
  BatteryMedium,
  Signal,
  Lock,
  Unlock,
  Bell,
  BellRing,
  Award,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronRight,
  Power,
  Volume2,
} from 'lucide-react';
import { useClearPass } from '../../context/ClearPassContext';

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  const {
    deviceMode,
    isPhoneLocked,
    setIsPhoneLocked,
    headsUpNotification,
    dismissHeadsUp,
    notifications,
    triggerDemoPushNotification,
    requestSystemPushPermission,
    pushPermissionGranted,
  } = useClearPass();

  // Screen completely off state (Phone closed / in sleep)
  const [isScreenOff, setIsScreenOff] = useState(false);
  const [screenWakeGlow, setScreenWakeGlow] = useState(false);

  // Automatically wake screen and illuminate lock screen when a notification arrives!
  useEffect(() => {
    if (headsUpNotification) {
      if (isScreenOff) {
        setIsScreenOff(false);
        setIsPhoneLocked(true); // Wake into Lock Screen showing notification
        setScreenWakeGlow(true);
        setTimeout(() => setScreenWakeGlow(false), 2000);
      }
    }
  }, [headsUpNotification, isScreenOff, setIsPhoneLocked]);

  const handleTogglePower = () => {
    if (!isScreenOff && !isPhoneLocked) {
      setIsPhoneLocked(true);
      setIsScreenOff(true);
    } else if (isScreenOff) {
      setIsScreenOff(false);
      setIsPhoneLocked(true);
    } else {
      setIsScreenOff(true);
    }
  };

  // If in responsive view, wrap without hardware bezel
  if (deviceMode !== 'mobile') {
    return (
      <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col shadow-lg border-x border-slate-200 relative">
        {/* Heads Up Banner in Responsive View */}
        {headsUpNotification && (
          <div className="absolute top-3 left-4 right-4 z-50 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  SIA ClearPass · Push Notification
                </span>
                <button onClick={dismissHeadsUp} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-white mt-0.5 truncate">{headsUpNotification.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{headsUpNotification.message}</p>
            </div>
          </div>
        )}

        {children}
      </div>
    );
  }

  // Realistic React Native Mobile Device Simulator
  return (
    <div className="py-4 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      {/* Smartphone Hardware Frame with Physical Side Buttons */}
      <div className="relative">
        {/* Hardware Volume Buttons (Left Edge) */}
        <div className="absolute -left-[15px] top-28 w-[4px] h-12 bg-slate-800 rounded-l-md border-l border-slate-700" />
        <div className="absolute -left-[15px] top-44 w-[4px] h-12 bg-slate-800 rounded-l-md border-l border-slate-700" />

        {/* Hardware Power / Sleep Button (Right Edge) */}
        <button
          onClick={handleTogglePower}
          className="absolute -right-[15px] top-32 w-[4px] h-16 bg-slate-700 hover:bg-blue-600 rounded-r-md border-r border-slate-600 cursor-pointer transition-colors"
          title="Physical Power Button (Sleep / Wake Phone)"
        />

        {/* Main Phone Body */}
        <div
          className={`relative border-[12px] border-slate-900 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] bg-slate-900 w-[390px] h-[812px] overflow-hidden flex flex-col select-none ring-1 ring-slate-800/80 transition-all duration-300 ${
            screenWakeGlow ? 'ring-4 ring-blue-500/80 shadow-[0_0_50px_rgba(59,130,246,0.5)]' : ''
          }`}
        >
          {/* Status Bar (Clock, Dynamic Island, Signals) */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-7 pt-3 pb-2 pointer-events-none select-none">
            <span
              className={`text-[13px] font-semibold tracking-tight transition-colors ${
                isScreenOff ? 'opacity-0' : isPhoneLocked ? 'text-white' : 'text-slate-900'
              }`}
            >
              9:41
            </span>

            {/* Dynamic Island Pill */}
            <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 space-x-1 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
            </div>

            {/* Status Icons */}
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                isScreenOff ? 'opacity-0' : isPhoneLocked ? 'text-white' : 'text-slate-900'
              }`}
            >
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <BatteryMedium className="w-4 h-4" />
            </div>
          </div>

          {/* HEADS-UP PUSH NOTIFICATION (Drops down from Dynamic Island even when in active app) */}
          {headsUpNotification && !isPhoneLocked && !isScreenOff && (
            <div className="absolute top-12 left-3 right-3 z-50 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-top-6 duration-300">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0 border border-blue-400/40">
                🔔
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                    SIA ClearPass
                  </span>
                  <button
                    onClick={dismissHeadsUp}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-xs font-bold text-white mt-0.5 truncate">{headsUpNotification.title}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-tight">
                  {headsUpNotification.message}
                </p>
              </div>
            </div>
          )}

          {/* 1. STATE: SCREEN OFF / PHONE CLOSED */}
          {isScreenOff ? (
            <div
              onClick={() => setIsScreenOff(false)}
              className="flex-1 bg-black flex flex-col items-center justify-center text-center p-6 cursor-pointer relative"
            >
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 animate-pulse">
                <Power className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="text-xs font-bold text-slate-400">Phone is Closed / Screen Off</h4>
              <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
                Notifications will automatically wake the screen when received.
              </p>
              <span className="inline-block mt-4 px-3 py-1 bg-slate-900 text-slate-400 text-[10px] rounded-full border border-slate-800">
                Tap Screen or Press Power to Wake
              </span>
            </div>
          ) : isPhoneLocked ? (
            // 2. STATE: PHONE LOCK SCREEN / STANDBY (Figure: Notifications outside system)
            <div className="flex-1 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 flex flex-col justify-between pt-14 pb-8 px-5 text-white overflow-y-auto">
              {/* Lock Status & Clock */}
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-6 h-6 flex items-center justify-center text-slate-400 mb-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs font-medium text-slate-300">Friday, October 2</p>
                <h1 className="text-6xl font-extralight tracking-tight text-white mt-1">9:41</h1>
              </div>

              {/* Lock Screen Notification Center (Shows push notifications even when system is closed) */}
              <div className="flex-1 my-6 space-y-2.5 overflow-y-auto pr-1">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Notification Center
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Push
                  </span>
                </div>

                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.notification_id}
                    onClick={() => {
                      setIsPhoneLocked(false);
                      setIsScreenOff(false);
                    }}
                    className="bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 transition-all cursor-pointer shadow-lg active:scale-98"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white">
                          SIA
                        </div>
                        <span className="text-[11px] font-bold text-white tracking-tight">SIA ClearPass</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">now</span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-100">{n.title}</h5>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Swipe Up or Tap to Unlock */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    setIsPhoneLocked(false);
                    setIsScreenOff(false);
                  }}
                  className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl font-semibold text-xs text-white border border-white/20 transition-all active:scale-98 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span>Tap or Swipe to Unlock & Open App</span>
                </button>
                <span className="text-[10px] text-slate-400">Lock Screen Standby Mode</span>
              </div>
            </div>
          ) : (
            // 3. STATE: ACTIVE REACT NATIVE MOBILE APP SCREEN
            <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col pt-10 pb-6 relative scrollbar-thin scrollbar-thumb-slate-300">
              {children}
            </div>
          )}

          {/* Home Indicator Bar */}
          <div
            onClick={() => {
              if (isScreenOff) {
                setIsScreenOff(false);
              } else {
                setIsPhoneLocked(!isPhoneLocked);
              }
            }}
            className="absolute bottom-1 left-0 right-0 z-50 flex justify-center py-2 cursor-pointer group"
            title="Click bottom bar to Lock/Unlock Phone"
          >
            <div
              className={`w-32 h-1 rounded-full transition-colors ${
                isScreenOff
                  ? 'bg-slate-800'
                  : isPhoneLocked
                  ? 'bg-white/60 group-hover:bg-white'
                  : 'bg-slate-800 group-hover:bg-slate-600'
              }`}
            />
          </div>
        </div>
      </div>

      {/* External Controls: Test Notifications Outside System & Hardware Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-md text-xs">
        <button
          onClick={handleTogglePower}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer ${
            isScreenOff
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : isPhoneLocked
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isScreenOff ? 'Turn Screen ON' : isPhoneLocked ? 'Close / Sleep Phone' : 'Lock Phone (Test Outside System)'}</span>
        </button>

        <button
          onClick={() => triggerDemoPushNotification('remarks')}
          className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/90 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          title="Trigger a new teacher remark notification"
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Simulate Teacher Remark</span>
        </button>

        <button
          onClick={() => triggerDemoPushNotification('approval')}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          title="Trigger an approval notification"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Simulate Teacher Signed</span>
        </button>

        {!pushPermissionGranted && (
          <button
            onClick={requestSystemPushPermission}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            title="Enable OS Desktop / Smartphone Push Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable OS Push</span>
          </button>
        )}
      </div>
    </div>
  );
};
