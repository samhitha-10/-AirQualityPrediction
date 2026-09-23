import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Heart, 
  Bell, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Lock, 
  Mail, 
  UserPlus, 
  LogIn, 
  LogOut, 
  AlertCircle,
  KeyRound,
  Calendar
} from 'lucide-react';
import { UserProfile, HealthSensitivity } from '../types/aqi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSaveUser: (updatedUser: UserProfile) => void;
}

const DEFAULT_ACCOUNTS: UserProfile[] = [
  {
    id: 'user_1',
    name: 'Samhitha Reddy',
    email: 'samhitha@example.com',
    password: 'password123',
    isLoggedIn: true,
    avatarColor: '#10b981',
    sensitivity: 'asthma_respiratory',
    favoriteCityIds: ['delhi', 'new-york', 'mumbai', 'beijing'],
    alertThresholdAQI: 100,
    enableAudioAlerts: true,
    enableBrowserNotifications: false,
    registeredAt: '2026-08-15',
  },
  {
    id: 'user_2',
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@respiratory.org',
    password: 'password123',
    isLoggedIn: false,
    avatarColor: '#3b82f6',
    sensitivity: 'cardiovascular',
    favoriteCityIds: ['london', 'tokyo'],
    alertThresholdAQI: 100,
    enableAudioAlerts: true,
    enableBrowserNotifications: true,
    registeredAt: '2026-09-01',
  },
];

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
}) => {
  // Mode: 'register' | 'login' | 'profile'
  const [authMode, setAuthMode] = useState<'register' | 'login' | 'profile'>(
    currentUser.isLoggedIn ? 'profile' : 'register'
  );

  // Form states
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sensitivity, setSensitivity] = useState<HealthSensitivity>(currentUser.sensitivity);
  const [alertThreshold, setAlertThreshold] = useState<number>(currentUser.alertThresholdAQI);
  const [audioAlerts, setAudioAlerts] = useState<boolean>(currentUser.enableAudioAlerts);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setAuthMode(currentUser.isLoggedIn ? 'profile' : 'register');
      setName(currentUser.name);
      setEmail(currentUser.email);
      setPassword('');
      setConfirmPassword('');
      setSensitivity(currentUser.sensitivity);
      setAlertThreshold(currentUser.alertThresholdAQI);
      setAudioAlerts(currentUser.enableAudioAlerts);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Retrieve existing stored accounts
  const getStoredAccounts = (): UserProfile[] => {
    try {
      const stored = localStorage.getItem('aqi_registered_accounts');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return DEFAULT_ACCOUNTS;
  };

  const saveStoredAccounts = (accounts: UserProfile[]) => {
    try {
      localStorage.setItem('aqi_registered_accounts', JSON.stringify(accounts));
    } catch {}
  };

  // Handle Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      setErrorMsg('An account with this email already exists. Please Sign In.');
      return;
    }

    const newProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      isLoggedIn: true,
      avatarColor: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][Math.floor(Math.random() * 5)],
      sensitivity,
      favoriteCityIds: currentUser.favoriteCityIds?.length ? currentUser.favoriteCityIds : ['delhi', 'new-york'],
      alertThresholdAQI: alertThreshold,
      enableAudioAlerts: audioAlerts,
      enableBrowserNotifications: false,
      registeredAt: new Date().toISOString().split('T')[0],
    };

    const updatedList = [...accounts, newProfile];
    saveStoredAccounts(updatedList);
    onSaveUser(newProfile);

    setSuccessMsg('Account registered successfully! Welcome to the Telemetry System.');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  // Handle Sign In / Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const accounts = getStoredAccounts();
    const found = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());

    if (!found) {
      setErrorMsg('No registered account found with this email. Please check spelling or register.');
      return;
    }

    if (found.password && found.password !== password) {
      setErrorMsg('Invalid password. (Hint: Demo password is "password123")');
      return;
    }

    const loggedInUser: UserProfile = {
      ...found,
      isLoggedIn: true,
    };

    onSaveUser(loggedInUser);
    setSuccessMsg(`Welcome back, ${found.name}!`);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  // Handle Profile Update
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      sensitivity,
      alertThresholdAQI: alertThreshold,
      enableAudioAlerts: audioAlerts,
    };
    onSaveUser(updated);

    // Also update in registered list
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((a) => a.id === currentUser.id);
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...updated };
      saveStoredAccounts(accounts);
    }

    setSuccessMsg('Profile updated successfully.');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Sign out
  const handleSignOut = () => {
    const guestUser: UserProfile = {
      id: `guest_${Date.now()}`,
      name: 'Guest Observer',
      email: 'guest@airquality.local',
      isLoggedIn: false,
      avatarColor: '#64748b',
      sensitivity: 'general',
      favoriteCityIds: ['delhi', 'new-york'],
      alertThresholdAQI: 150,
      enableAudioAlerts: false,
      enableBrowserNotifications: false,
    };
    onSaveUser(guestUser);
    setAuthMode('login');
  };

  // Quick Demo account fill
  const handleFillDemo = (demo: UserProfile) => {
    setEmail(demo.email);
    setPassword('password123');
    setName(demo.name);
    setSensitivity(demo.sensitivity);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              {authMode === 'register' ? (
                <UserPlus className="w-4 h-4" />
              ) : authMode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {authMode === 'register'
                  ? 'Create New Account (Register)'
                  : authMode === 'login'
                  ? 'Sign In to Telemetry System'
                  : 'User Profile & Respiratory Settings'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Personalized exposure surveillance & medical sensitivity tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs font-mono cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'login'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          {currentUser.isLoggedIn && (
            <button
              type="button"
              onClick={() => {
                setAuthMode('profile');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'profile'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile ({currentUser.name.split(' ')[0]})</span>
            </button>
          )}
        </div>

        {/* Alert / Notice Messages */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* REGISTER FORM */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-400" />
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samhitha Reddy"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1">
                  <Mail className="w-3 h-3 text-emerald-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="samhitha@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-400" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            {/* Health Sensitivity Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Select Health Sensitivity Profile
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                {[
                  { id: 'general', label: 'General Adult (Healthy)', desc: 'Standard EPA thresholds' },
                  { id: 'asthma_respiratory', label: 'Asthma / Respiratory Sensitive', desc: 'Guarded at AQI > 100' },
                  { id: 'cardiovascular', label: 'Cardiovascular Condition', desc: 'PM2.5 vascular protection' },
                  { id: 'children_pediatric', label: 'Parent / Pediatric Care', desc: 'Developing lungs safeguard' },
                  { id: 'elderly', label: 'Senior Citizen (65+)', desc: 'Early warning trigger' },
                  { id: 'outdoor_athlete', label: 'Outdoor Athlete / Cyclist', desc: 'Heavy cardio ventilation risk' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setSensitivity(opt.id as HealthSensitivity)}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between ${
                      sensitivity === opt.id
                        ? 'border-emerald-500 bg-emerald-950/30 text-white'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-200 text-xs">{opt.label}</div>
                      <div className="text-[10px] text-slate-500">{opt.desc}</div>
                    </div>
                    {sensitivity === opt.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Alert Threshold */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Default Alert Trigger Threshold: AQI &gt; {alertThreshold}
              </label>
              <div className="flex items-center gap-2">
                {[50, 100, 150, 200, 300].map((th) => (
                  <button
                    type="button"
                    key={th}
                    onClick={() => setAlertThreshold(th)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      alertThreshold === th
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {th}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Complete Registration & Save Profile</span>
            </button>
          </form>
        )}

        {/* SIGN IN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <Mail className="w-3 h-3 text-emerald-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="samhitha@example.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            {/* Quick Demo Pre-fill helper */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick Test Accounts:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleFillDemo(acc)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="font-semibold truncate">{acc.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Register Instead
              </button>
            </div>
          </form>
        )}

        {/* PROFILE / ACTIVE SETTINGS FORM */}
        {authMode === 'profile' && currentUser.isLoggedIn && (
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            {/* Account card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: currentUser.avatarColor || '#10b981' }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{currentUser.name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{currentUser.email}</div>
                  {currentUser.registeredAt && (
                    <div className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                      <Calendar className="w-2.5 h-2.5" /> Registered: {currentUser.registeredAt}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Active Health Profile
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'general', label: 'General Adult' },
                  { id: 'asthma_respiratory', label: 'Asthma / Respiratory' },
                  { id: 'cardiovascular', label: 'Cardiovascular' },
                  { id: 'children_pediatric', label: 'Pediatric Care' },
                  { id: 'elderly', label: 'Senior Citizen' },
                  { id: 'outdoor_athlete', label: 'Outdoor Athlete' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setSensitivity(opt.id as HealthSensitivity)}
                    className={`p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      sensitivity === opt.id
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-semibold'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sensitivity === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Trigger AQI Threshold
              </label>
              <div className="flex items-center gap-2">
                {[50, 100, 150, 200, 300].map((th) => (
                  <button
                    type="button"
                    key={th}
                    onClick={() => setAlertThreshold(th)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      alertThreshold === th
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {th}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-300">Audible Alert Sound (Chime)</div>
              <button
                type="button"
                onClick={() => setAudioAlerts(!audioAlerts)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  audioAlerts
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {audioAlerts ? 'Enabled' : 'Muted'}
              </button>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
