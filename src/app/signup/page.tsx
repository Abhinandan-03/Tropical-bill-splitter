"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong' | ''>('');

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (!val) setStrength('');
    else if (val.length < 6) setStrength('weak');
    else if (val.length < 10) setStrength('medium');
    else setStrength('strong');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name.trim()) return setError('Please enter your full name.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { name } }
      });
      if (error) throw error;
      if (data.user) {
        setSuccess('Welcome aboard! Redirecting to your dashboard...');
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      if (message.toLowerCase().includes('already')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const strengthColor = strength === 'weak' ? '#FF885D' : strength === 'medium' ? '#FFC107' : '#12D8FA';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 antialiased relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #FF7E5F 0%, #FEB47B 50%, #9B72AA 100%)' }}>

      <main className="w-full max-w-md relative z-10">
        <div className="glass-card nautical-border p-8 relative overflow-hidden">
          {/* Floating boat decoration */}
          <div className="absolute -top-4 -right-4 pointer-events-none animate-float" style={{ color: '#002a48', opacity: 0.2 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>sailing</span>
          </div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="flex justify-center items-center gap-2 mb-2">
              <span className="material-symbols-outlined" style={{ color: '#006879', fontVariationSettings: "'FILL' 1" }}>directions_boat</span>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 700, color: '#002a48' }}>VoyageSplit</h1>
            </div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '16px', color: '#42474e' }}>Smooth Sailing for Your Wallet</p>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ffdad6', color: '#93000a' }}>{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#d1fae5', color: '#065f46' }}>{success}</div>}

          <form onSubmit={handleSignup} className="space-y-6 relative z-10">
            {/* Full Name */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#42474e' }}>Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 px-2" style={{ color: '#72777f' }}>person</span>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Captain Smith" required className="input-ocean" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#42474e' }}>Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 px-2" style={{ color: '#72777f' }}>mail</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="captain@voyage.com" required className="input-ocean" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#42474e' }}>Password</label>
              <div className="relative mb-2">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 px-2" style={{ color: '#72777f' }}>lock</span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => handlePasswordChange(e.target.value)} placeholder="••••••••" required className="input-ocean pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2" style={{ color: '#72777f', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {/* Strength bar */}
              <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: '#e2e2e6' }}>
                <div className={`strength-bar ${strength ? `strength-${strength}` : ''}`} />
              </div>
              <p className="text-right h-4 mt-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, color: strength ? strengthColor : 'transparent' }}>
                {strength ? strength.charAt(0).toUpperCase() + strength.slice(1) : '.'}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#42474e' }}>Confirm Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 px-2" style={{ color: '#72777f' }}>lock_clock</span>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="input-ocean" />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full flex items-center justify-center gap-2 py-3 mt-8"
              style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em' }}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Join the Crew <span className="material-symbols-outlined">sailing</span></>
              )}
            </button>

            <div className="text-center mt-4">
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '16px', color: '#42474e' }}>
                Already aboard?{' '}
                <Link href="/login" style={{ color: '#006879', fontWeight: 700, textDecoration: 'underline', textDecorationThickness: '2px', textDecorationColor: 'rgba(0,104,121,0.3)', textUnderlineOffset: '4px' }}>
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
        <div className="text-center mt-8" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
          © 2024 VoyageSplit
        </div>
      </main>
    </div>
  );
}
