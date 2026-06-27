"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { calculateBalances, Balance, GroupMember, GroupExpense } from '@/lib/utils/balances';
import { useParams, useRouter } from 'next/navigation';

type Group = { id: string; group_name: string; created_by: string; created_at: string };

export default function GroupDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Expense Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async (uid: string, groupId: string) => {
    try {
      // 1. Fetch group details
      const { data: gData, error: gErr } = await supabase.from('shared_groups').select('*').eq('id', groupId).single();
      if (gErr) throw gErr;
      setGroup(gData);

      // 2. Fetch members
      const { data: mData, error: mErr } = await supabase.from('group_members')
        .select(`user_id, users(name, email)`).eq('group_id', groupId);
      if (mErr) throw mErr;
      
      // 3. Fetch expenses
      const { data: eData, error: eErr } = await supabase.from('group_expenses')
        .select('*').eq('group_id', groupId).order('created_at', { ascending: false });
      if (eErr) throw eErr;

      setMembers(mData as any);
      setExpenses(eData);
      
      // 4. Calculate Balances
      const calculated = calculateBalances(mData as any, eData);
      setBalances(calculated);
    } catch (err) {
      console.error('Fetch error:', err);
      // Fallback if user doesn't have access or group deleted
      router.push('/dashboard/groups');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        void fetchData(user.id, id);
      }
    });
  }, [id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !group) return;
    setError('');
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return setError('Please enter a valid amount greater than 0.');
    
    setIsSubmitting(true);
    try {
      const { error: err } = await supabase.from('group_expenses')
        .insert([{ group_id: group.id, paid_by: userId, description, amount: num }]);
      if (err) throw err;
      
      setDescription('');
      setAmount('');
      void fetchData(userId, group.id);
    } catch (error: any) {
      setError(error.message || 'Failed to add expense.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteExpense = async (expenseId: string) => {
    await supabase.from('group_expenses').delete().eq('id', expenseId);
    if (userId && group) void fetchData(userId, group.id);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#006879' }} />
    </div>
  );
  
  if (!group) return null;

  const isOwner = group.created_by === userId;

  return (
    <div>
      <button onClick={() => router.push('/dashboard/groups')} className="flex items-center gap-1 mb-6 transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, color: '#72777f' }} onMouseEnter={e => e.currentTarget.style.color = '#002a48'} onMouseLeave={e => e.currentTarget.style.color = '#72777f'}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Back to Voyages
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '40px', fontWeight: 800, color: '#002a48', marginBottom: '8px' }}>
            {group.group_name}
          </h1>
          <div className="flex items-center gap-4 text-sm" style={{ fontFamily: "'Montserrat', sans-serif", color: '#42474e' }}>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group</span> {members.length} members</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>key</span> Voyage ID: <code className="bg-gray-100 px-2 py-0.5 rounded ml-1">{group.id}</code></span>
          </div>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(group.id); alert('Voyage ID copied to clipboard!'); }}
                className="btn-gradient flex items-center gap-2 px-6 py-2 shadow-lg"
                style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600 }}>
          <span className="material-symbols-outlined text-sm">content_copy</span>
          Copy ID to Invite
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Log Expense & Members */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Add Group Expense */}
          <section className="glass-card nautical-border p-6">
            <h2 className="flex items-center gap-2 mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 600, color: '#002a48' }}>
              <span className="material-symbols-outlined" style={{ color: '#006879' }}>receipt_long</span>
              Log Shared Expense
            </h2>
            
            {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ffdad6', color: '#93000a' }}>{error}</div>}
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block mb-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 600, color: '#42474e' }}>Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Yacht Rental" required
                       className="w-full px-3 py-2 border rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.5)', borderColor: '#c2c7cf' }} />
              </div>
              <div>
                <label className="block mb-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 600, color: '#42474e' }}>Amount (₹)</label>
                <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required
                       className="w-full px-3 py-2 border rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.5)', borderColor: '#c2c7cf' }} />
              </div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#72777f', fontStyle: 'italic' }}>
                Note: This expense will be split equally among all {members.length} members.
              </p>
              <button type="submit" disabled={isSubmitting} className="w-full btn-gradient flex items-center justify-center gap-2 py-3 mt-4">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Expense'}
              </button>
            </form>
          </section>

          {/* Members List */}
          <section className="glass-card nautical-border p-6">
            <h2 className="flex items-center gap-2 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 600, color: '#002a48' }}>
              <span className="material-symbols-outlined" style={{ color: '#006879' }}>groups</span>
              Crew Members
            </h2>
            <div className="space-y-3">
              {members.map(m => (
                <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold uppercase">
                    {(m.users?.name || m.users?.email || '?').charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, color: '#1a1c1f' }}>
                      {m.users?.name || 'Unknown'} {m.user_id === userId && '(You)'}
                    </p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#72777f' }}>{m.users?.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Balances and Expenses */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Balances Section */}
          <section className="glass-card nautical-border p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,249,255,0.9) 100%)' }}>
            <h2 className="flex items-center gap-2 mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48' }}>
              <span className="material-symbols-outlined" style={{ color: '#006879' }}>account_balance_wallet</span>
              Who Owes Whom?
            </h2>
            
            {balances.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined mb-2 block" style={{ fontSize: '32px', color: '#c2c7cf' }}>check_circle</span>
                <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#72777f' }}>All settled up! No one owes anything.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {balances.map((balance, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl shadow-sm border" style={{ background: '#fff', borderColor: 'rgba(0,104,121,0.1)' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 700, color: '#93000a' }}>{balance.fromUser === userId ? 'You' : balance.fromName.split(' ')[0]}</span>
                      <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>arrow_forward</span>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 700, color: '#006879' }}>{balance.toUser === userId ? 'You' : balance.toName.split(' ')[0]}</span>
                    </div>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: 800, color: '#1a1c1f' }}>
                      ₹{balance.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Group Expenses List */}
          <section>
            <h3 className="mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 600, color: '#002a48' }}>
              Recent Voyage Expenses
            </h3>
            
            {expenses.length === 0 ? (
              <div className="text-center py-8 glass-card">
                <p style={{ fontFamily: "'Montserrat', sans-serif", color: '#72777f' }}>No expenses logged yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map(expense => {
                  const payer = members.find(m => m.user_id === expense.paid_by);
                  const payerName = payer?.users?.name || 'Someone';
                  const isPayer = expense.paid_by === userId;
                  
                  return (
                    <div key={expense.id} className="glass-card p-4 flex justify-between items-center transition-transform hover:-translate-y-1">
                      <div>
                        <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: 600, color: '#002a48' }}>{expense.description}</h4>
                        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', color: '#72777f', marginTop: '2px' }}>
                          Paid by <strong style={{ color: isPayer ? '#006879' : '#1a1c1f' }}>{isPayer ? 'You' : payerName}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 800, color: '#002a48' }}>
                          ₹{Number(expense.amount).toFixed(2)}
                        </span>
                        {(isPayer || isOwner) && (
                          <button onClick={() => handleDeleteExpense(expense.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
