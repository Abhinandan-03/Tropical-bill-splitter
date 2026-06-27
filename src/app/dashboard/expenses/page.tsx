"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

type Expense = { id: string; amount: number; description: string; category: string; created_at: string };
const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other'];
const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Entertainment: '🎟️', Shopping: '🛍️', Utilities: '💡', Health: '💊', Other: '✨'
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [error, setError] = useState('');

  const fetchExpenses = async (uid: string) => {
    const { data } = await supabase.from('personal_expenses').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    setExpenses(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        void fetchExpenses(user.id);
      }
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setError('');
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return setError('Please enter a valid amount greater than 0.');
    setIsSubmitting(true);
    try {
      const { data, error: err } = await supabase.from('personal_expenses')
        .insert([{ user_id: userId, description, amount: num, category }]).select().single();
      if (err) throw err;
      setExpenses(prev => data ? [data, ...prev] : prev);
      setDescription(''); setAmount(''); setCategory('Food');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add expense. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('personal_expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const count = expenses.length;
  const average = count > 0 ? total / count : 0;
  const thisMonth = expenses.filter(e => new Date(e.created_at).getMonth() === new Date().getMonth()).reduce((s, e) => s + Number(e.amount), 0);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#006879' }} />
    </div>
  );

  const statLabel = { fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600 as const, letterSpacing: '0.05em', color: '#42474e', marginBottom: '4px' };
  const statValue = (color: string) => ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 700 as const, lineHeight: '36px', color });

  return (
    <div>
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '48px', fontWeight: 800, color: '#002a48', marginBottom: '8px' }}>My Expenses</h1>
      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '18px', color: '#42474e', marginBottom: '32px' }}>Track every doubloon of your voyage.</p>

      {/* Add Expense Form */}
      <section className="mb-8 relative overflow-hidden rounded-xl p-6 md:p-8"
               style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 20px rgba(0,42,72,0.08)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(18,216,250,0.05) 0%, transparent 60%)' }} />
        <h2 className="flex items-center gap-2 mb-6 relative z-10" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48' }}>
          <span className="material-symbols-outlined" style={{ color: '#006879' }}>add_circle</span>
          Log a New Expense
        </h2>

        {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ffdad6', color: '#93000a' }}>{error}</div>}

        <form onSubmit={handleAdd} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label style={statLabel}>Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Piña Coladas" required
                     className="w-full" style={{ background: 'transparent', border: 'none', borderBottom: '2px solid #c2c7cf', padding: '8px 0', fontFamily: "'Montserrat', sans-serif", fontSize: '16px', outline: 'none', color: '#1a1c1f', transition: 'border-color 0.3s' }}
                     onFocus={e => e.target.style.borderBottomColor = '#006879'}
                     onBlur={e => e.target.style.borderBottomColor = '#c2c7cf'} />
            </div>
            <div className="space-y-2">
              <label style={statLabel}>Amount (₹)</label>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required
                     className="w-full" style={{ background: 'transparent', border: 'none', borderBottom: '2px solid #c2c7cf', padding: '8px 0', fontFamily: "'Montserrat', sans-serif", fontSize: '16px', outline: 'none', color: '#1a1c1f', transition: 'border-color 0.3s' }}
                     onFocus={e => e.target.style.borderBottomColor = '#006879'}
                     onBlur={e => e.target.style.borderBottomColor = '#c2c7cf'} />
            </div>
          </div>
          <div className="space-y-2">
            <label style={statLabel}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} required
                    className="w-full" style={{ background: 'transparent', border: 'none', borderBottom: '2px solid #c2c7cf', padding: '8px 0', fontFamily: "'Montserrat', sans-serif", fontSize: '16px', outline: 'none', color: '#1a1c1f' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>)}
            </select>
          </div>
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={isSubmitting}
                    className="vintage-ticket flex items-center gap-2 px-8 py-3 uppercase tracking-widest hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, color: '#002a48', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-sm">confirmation_number</span>}
              Add Expense
            </button>
          </div>
        </form>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Spent', value: `₹${total.toFixed(2)}`, color: '#002a48' },
          { label: 'This Month', value: `₹${thisMonth.toFixed(2)}`, color: '#006879' },
          { label: 'No. of Expenses', value: String(count), color: '#732200' },
          { label: 'Average', value: `₹${average.toFixed(2)}`, color: '#002a48' },
        ].map((s, i) => (
          <div key={i} className="glass-card nautical-border !p-4">
            <p style={statLabel}>{s.label}</p>
            <p style={statValue(s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Expense Log */}
      <section className="space-y-6">
        <h2 className="flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48' }}>
          <span className="material-symbols-outlined" style={{ color: '#006879' }}>menu_book</span>
          Captain&apos;s Expense Log
        </h2>

        {expenses.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#72777f' }}>
            <span className="material-symbols-outlined mb-4 block" style={{ fontSize: '48px', color: '#c2c7cf' }}>receipt_long</span>
            <p style={{ fontFamily: "'Montserrat', sans-serif" }}>No expenses logged yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenses.map(expense => (
              <div key={expense.id} className="rounded-xl p-4 flex items-center justify-between group hover:shadow-md transition-shadow nautical-border"
                   style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,42,72,0.06)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
                       style={{ background: 'rgba(245,245,220,0.3)', borderColor: '#F5F5DC' }}>
                    {CATEGORY_EMOJIS[expense.category] || '✨'}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#1a1c1f' }}>{expense.description}</h3>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', color: '#42474e', marginTop: '4px' }}>
                      {new Date(expense.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48' }}>₹{Number(expense.amount).toFixed(2)}</span>
                    <div className="mt-1 rounded-full px-2 py-0.5 inline-block"
                         style={{ background: 'rgba(78,20,0,0.1)', fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, color: '#4e1400' }}>
                      {expense.category}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(expense.id)}
                          className="p-2 rounded-full transition-colors"
                          style={{ color: '#72777f', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ba1a1a'; (e.currentTarget as HTMLButtonElement).style.background = '#ffdad6'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#72777f'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
