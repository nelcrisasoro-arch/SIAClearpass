import React, { useState } from 'react';
import { useClearPass } from '../../context/ClearPassContext';
import { UserRole } from '../../types/clearpass';
import { UserCheck, Users, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { SchoolLogo } from '../common/SchoolLogo';

interface Props {
  onSuccess?: () => void;
  lockedRole?: UserRole;
  onBack?: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onSuccess, lockedRole, onBack }) => {
  const { authenticateUser } = useClearPass();
  const [selectedRole, setSelectedRole] = useState<UserRole>('Student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const activeRole = lockedRole ?? selectedRole;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setUsername('');
    setErrorMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await authenticateUser(username, password, activeRole);
    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.message || 'Invalid login credentials for the selected role.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8">
      {/* School Crest / Logo */}
      <div className="flex flex-col items-center text-center mb-6">
        <SchoolLogo size="lg" className="justify-center mb-2" />
        <div className="w-12 h-6 bg-blue-900 text-white font-extrabold text-[11px] rounded-full flex items-center justify-center shadow-sm">
          SIA
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mt-2">{lockedRole ? `${lockedRole} Login` : 'Welcome!'}</h2>
        <p className="text-xs text-slate-500 font-medium">St. Isidore Academy of Trinidad Bohol, Inc.</p>
        <span className="text-[10px] text-blue-900 font-semibold tracking-wider uppercase">SIA ClearPass System</span>
      </div>

      {/* The role is fixed when this page is opened from its dedicated portal route. */}
      {!lockedRole ? <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-600 mb-2 text-center">
          Select role:
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          {/* Personnel */}
          <button
            type="button"
            onClick={() => handleRoleSelect('Personnel')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'Personnel'
                ? 'border-blue-900 bg-blue-50 text-blue-950 font-bold shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-full ${selectedRole === 'Personnel' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs">Personnel</span>
          </button>

          {/* Student */}
          <button
            type="button"
            onClick={() => handleRoleSelect('Student')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'Student'
                ? 'border-blue-900 bg-blue-50 text-blue-950 font-bold shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-full ${selectedRole === 'Student' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs">Student</span>
          </button>
        </div>
      </div> : (
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-950">
            {lockedRole === 'Student' ? <Users className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            Sign in to the {lockedRole} portal
          </span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4 max-w-xs mx-auto w-full">
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your assigned username"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all shadow-inner"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all shadow-inner pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer mt-2"
        >
          Login
        </button>
      </form>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mx-auto mt-5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-950"
        >
          <ArrowLeft className="h-4 w-4" /> Back to account selection
        </button>
      )}

    </div>
  );
};
