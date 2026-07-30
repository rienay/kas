import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await api.login(email, password);
      onLoginSuccess(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal. Hubungi admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-pink-50/50 to-sky-50 geo-grid relative overflow-hidden font-sans">
      {/* Decorative Ambient Pastel Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 right-10 w-40 h-40 border border-purple-200/60 rounded-3xl pointer-events-none hidden md:block"></div>

      <div className="w-full max-w-md relative glass-panel p-8 rounded-3xl shadow-xl shadow-purple-900/5 border border-white/80 geo-corner-decor">
        
        {/* Logo & Org Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-violet-100 border border-violet-200/80 rounded-2xl flex items-center justify-center mb-3 relative shadow-inner">
            {/* Scout Lily / Fleur-de-lis SVG representation */}
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-violet-600 fill-none stroke-current" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L9 9H15L12 2Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C12 22 6 17 6 12C6 9 8 8 12 8C16 8 18 9 18 12C18 17 12 22 12 22Z" />
              <path d="M4 12C7 12 8 13 12 15C16 13 17 12 20 12" />
            </svg>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-400 rounded-full"></div>
          </div>
          
          <h1 className="text-xl font-display font-bold tracking-wider text-slate-800">KAS DKC OUTLET</h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide mt-1 uppercase text-center">
            Dewan Kerja Cabang Gerakan Pramuka
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label htmlFor="email-input" className="block text-xs font-bold tracking-wider text-slate-600 uppercase">
              Email / Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-violet-400">
                <Mail size={16} />
              </span>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bendarahadkckabcilacap@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:bg-white text-sm font-sans rounded-xl transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="password-input" className="block text-xs font-bold tracking-wider text-slate-600 uppercase">
              Kata Sandi
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-violet-400">
                <Lock size={16} />
              </span>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:bg-white text-sm font-sans rounded-xl transition"
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 bg-slate-100 border-slate-300 text-violet-600 rounded focus:ring-0 focus:ring-offset-0 focus:outline-none"
              />
              <span className="font-medium">Ingat Saya</span>
            </label>
            <span className="text-violet-600 hover:underline font-semibold cursor-help">Bantuan Login?</span>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            id="login-submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display text-xs font-bold uppercase tracking-widest transition duration-150 flex items-center justify-center space-x-2 rounded-xl shadow-lg shadow-violet-500/20 group disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin text-white" size={16} />
            ) : (
              <>
                <span>MASUK SEBAGAI BENDAHARA</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Guest Access Button */}
        <button
          type="button"
          onClick={() => onLoginSuccess({ email: 'anggota@dkc.org', nama: 'Anggota DKC', role: 'Anggota' })}
          className="w-full py-2.5 bg-slate-100/90 border border-slate-200 hover:bg-slate-200 text-slate-600 font-display text-xs font-bold uppercase tracking-wider transition duration-150 flex items-center justify-center space-x-2 mt-3 rounded-xl"
        >
          <span>Batal / Lihat sebagai Anggota</span>
        </button>

      </div>
    </div>
  );
}
