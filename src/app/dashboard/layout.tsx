"use client";

import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUser(session.user);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Home', icon: 'home' },
    { href: '/dashboard/expenses', label: 'Expenses', icon: 'receipt_long' },
    { href: '/dashboard/groups', label: 'Groups', icon: 'groups' },
  ];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center dashboard-bg">
      <div className="text-center">
        <span className="material-symbols-outlined animate-spin text-4xl" style={{ color: '#006879' }}>sync</span>
        <p style={{ color: '#42474e', marginTop: '8px' }}>Loading your voyage...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen dashboard-bg">
      {/* ===== Desktop Sidebar ===== */}
      <nav className="hidden md:flex flex-col h-screen py-8 border-r fixed left-0 w-64 z-40"
           style={{ borderColor: 'rgba(194,199,207,0.3)', borderRadius: '0 12px 12px 0', background: 'rgba(249,249,253,0.95)', boxShadow: '0 4px 30px rgba(0,42,72,0.08)', backdropFilter: 'blur(12px)' }}>
        
        {/* Logo / Profile */}
        <div className="px-6 mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-4 mb-4 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #002a48, #12D8FA)', borderColor: '#1fdcfe' }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: '28px' }}>directions_boat</span>
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48', textAlign: 'center' }}>Captain&apos;s Log</h2>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, color: '#42474e', marginTop: '2px' }}>
            {user.email?.split('@')[0]}
          </p>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-4">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <div className="flex items-center gap-3 px-4 py-3 mx-2 rounded-full transition-colors cursor-pointer"
                     style={{
                       background: isActive ? '#1fdcfe' : 'transparent',
                       color: isActive ? '#001f26' : '#42474e',
                       fontFamily: "'Montserrat', sans-serif",
                       fontSize: '14px',
                       fontWeight: 600,
                       letterSpacing: '0.05em',
                     }}
                     onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#e7e8ec'; }}
                     onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                  <span className="material-symbols-outlined">{link.icon}</span>
                  {link.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="px-6 mt-8">
          <div className="border-t pt-4 space-y-2" style={{ borderColor: 'rgba(194,199,207,0.3)' }}>
            <div className="px-4 py-2 text-xs truncate" style={{ fontFamily: "'Montserrat', sans-serif", color: '#42474e', fontWeight: 600 }}>
              {user.email}
            </div>
            <button onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 w-full rounded-full transition-colors"
                    style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, color: '#42474e', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e7e8ec')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* ===== Mobile Top Bar ===== */}
      <header className="md:hidden fixed top-0 w-full flex justify-between items-center px-5 py-4 z-50"
              style={{ background: 'rgba(249,249,253,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 4px rgba(0,42,72,0.08)' }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 700, color: '#002a48' }}>VoyageSplit</div>
        <div className="flex gap-4" style={{ color: '#006879' }}>
          <span className="material-symbols-outlined">notifications</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ color: '#006879' }}>{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full z-40 p-4"
             style={{ background: 'rgba(249,249,253,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(194,199,207,0.3)' }}>
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-full mb-1 cursor-pointer"
                     style={{ background: isActive ? '#1fdcfe' : 'transparent', color: isActive ? '#001f26' : '#42474e', fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                  <span className="material-symbols-outlined">{link.icon}</span>
                  {link.label}
                </div>
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-full"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba1a1a', fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
            Log Out
          </button>
        </div>
      )}

      {/* ===== Main Content ===== */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-8 px-5 md:px-10 pb-32 min-h-screen wave-bg">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* ===== Mobile Bottom Nav ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 rounded-t-xl"
           style={{ background: 'rgba(249,249,253,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 -4px 20px rgba(0,104,121,0.1)' }}>
        {navLinks.map(link => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div className={`flex flex-col items-center justify-center p-2 ${isActive ? 'rounded-full -mt-4 shadow-lg' : ''}`}
                   style={{
                     background: isActive ? '#006879' : 'transparent',
                     color: isActive ? '#ffffff' : '#42474e',
                     padding: isActive ? '12px' : '8px',
                     scale: isActive ? '1.1' : '1',
                   }}>
                <span className="material-symbols-outlined">{link.icon}</span>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, marginTop: '2px', display: isActive ? 'none' : 'block' }}>
                  {link.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
