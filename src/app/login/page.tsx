"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-5 md:p-10 antialiased relative overflow-hidden">
      <div className="wave-pattern" />
      <div className="wave-pattern-2" />

      <div className="w-full max-w-[480px] relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl border"
               style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.3)' }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: '40px' }}>directions_boat</span>
          </div>
          <h1 className="text-white drop-shadow-md" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '48px', fontWeight: 800, lineHeight: '56px', letterSpacing: '-0.02em' }}>
            VoyageSplit
          </h1>
          <p className="mt-2" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '18px', color: 'rgba(255,255,255,0.8)' }}>
            Smooth Sailing for Your Wallet
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card nautical-border p-8 relative">
          <h2 className="text-center mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48' }}>
            Welcome Aboard
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ffdad6', color: '#93000a' }}>{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block mb-2" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#42474e' }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined" style={{ color: '#72777f' }}>mail</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="captain@voyagesplit.com"
                  required
                  className="block w-full pl-10 pr-3 py-3 border rounded-lg transition-colors"
                  style={{ borderColor: '#c2c7cf', background: 'rgba(249,249,253,0.5)', fontFamily: "'Montserrat', sans-serif", fontSize: '16px', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#ffd700'}
                  onBlur={e => e.target.style.borderColor = '#c2c7cf'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#42474e' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined" style={{ color: '#72777f' }}>lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-10 py-3 border rounded-lg transition-colors"
                  style={{ borderColor: '#c2c7cf', background: 'rgba(249,249,253,0.5)', fontFamily: "'Montserrat', sans-serif", fontSize: '16px', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#ffd700'}
                  onBlur={e => e.target.style.borderColor = '#c2c7cf'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors"
                  style={{ color: '#72777f', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <a href="#" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, color: '#006879' }}>
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full flex items-center justify-center gap-2 py-4 mt-8 shadow-lg"
              style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em' }}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>Set Sail</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>sailing</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '16px', color: '#42474e' }}>
              New to the crew?{' '}
              <Link href="/signup" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, color: '#006879', textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '4px', marginLeft: '4px' }}>
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
