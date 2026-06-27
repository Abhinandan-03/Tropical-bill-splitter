"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DashboardHome() {
  const [userName, setUserName] = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [groupCount, setGroupCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Traveler';
      setUserName(displayName);

      const { data: expenses } = await supabase
        .from('personal_expenses')
        .select('amount')
        .eq('user_id', user.id);
      if (expenses) setTotalExpenses(expenses.reduce((s, e) => s + Number(e.amount), 0));

      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setGroupCount(count || 0);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Spent', value: `₹${totalExpenses.toFixed(2)}`, icon: 'anchor', bg: 'rgba(207,229,255,0.2)', iconColor: '#002a48', badge: 'Voyage' },
    { label: 'Active Groups', value: `${groupCount} Crews`, icon: 'sailing', bg: 'rgba(170,237,255,0.2)', iconColor: '#006879', badge: null },
    { label: 'You Owe', value: '₹0.00', icon: 'water_drop', bg: '#ffdad6', iconColor: '#ba1a1a', badge: null },
    { label: 'Owed to You', value: '₹0.00', icon: 'waves', bg: '#ffdbcf', iconColor: '#732200', badge: null },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '48px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: '56px', color: '#002a48', marginBottom: '8px' }}>
          Welcome Aboard.
        </h1>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '18px', color: '#42474e' }}>
          Here&apos;s the current state of your voyage ledger, {userName}.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="glass-card nautical-border p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-full" style={{ background: card.bg }}>
                <span className="material-symbols-outlined text-3xl" style={{ color: card.iconColor }}>{card.icon}</span>
              </div>
              {card.badge && (
                <span className="p-1 rounded" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, background: '#ededf2', color: '#42474e' }}>
                  {card.badge}
                </span>
              )}
            </div>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#42474e', marginBottom: '4px' }}>{card.label}</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 700, color: i === 2 ? '#ba1a1a' : i === 3 ? '#732200' : '#002a48', lineHeight: '40px' }}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Expenses Table */}
      <div className="glass-card nautical-border p-6 md:p-8">
        <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid rgba(194,199,207,0.2)' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48' }}>Recent Port Charges</h2>
          <button style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, color: '#006879', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
        </div>
        <div className="py-12 text-center" style={{ color: '#42474e' }}>
          <span className="material-symbols-outlined mb-4 block" style={{ fontSize: '48px', color: '#c2c7cf' }}>anchor</span>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '16px', color: '#72777f' }}>
            No recent charges. Start logging your expenses!
          </p>
        </div>
      </div>
    </div>
  );
}
