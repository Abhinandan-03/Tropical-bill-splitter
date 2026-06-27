"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

type Group = { id: string; group_name: string; created_by: string; created_at: string; group_members: [{ count: number }] };

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [joinGroupId, setJoinGroupId] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const fetchGroups = async () => {
    const { data } = await supabase.from('shared_groups').select('*, group_members(count)').order('created_at', { ascending: false });
    setGroups(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        void fetchGroups();
      }
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setError('');
    if (groupName.trim().length < 3) return setError('Group name must be at least 3 characters long.');
    setIsSubmitting(true);
    try {
      const { data: groupData, error: gErr } = await supabase.from('shared_groups')
        .insert([{ group_name: groupName.trim(), created_by: userId }]).select().single();
      if (gErr) throw gErr;
      const { error: mErr } = await supabase.from('group_members').insert([{ group_id: groupData.id, user_id: userId }]);
      if (mErr) throw mErr;
      setGroupName('');
      void fetchGroups();
    } catch (error: any) {
      console.error('Group creation error:', error);
      const message = error?.message || (typeof error === 'string' ? error : 'Failed to create group. Please try again.');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('shared_groups').delete().eq('id', id);
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setError('');
    const id = joinGroupId.trim();
    if (!id || id.length < 10) return setError('Please enter a valid Voyage ID.');
    setIsJoining(true);
    try {
      const { error: mErr } = await supabase.from('group_members').insert([{ group_id: id, user_id: userId }]);
      if (mErr) {
        if (mErr.code === '23505') throw new Error('You are already part of this voyage.');
        if (mErr.code === '23503') throw new Error('Voyage ID not found. Are you sure it is correct?');
        throw mErr;
      }
      setJoinGroupId('');
      void fetchGroups();
    } catch (error: any) {
      console.error('Group join error:', error);
      setError(error.message || 'Failed to join group. Please check the ID and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const createdGroups = groups.filter(g => g.created_by === userId);
  const joinedGroups = groups.filter(g => g.created_by !== userId);

  const labelStyle = { fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600 as const, letterSpacing: '0.05em', color: '#1a1c1f' };
  const sectionTitle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600 as const, color: '#002a48', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#006879' }} />
    </div>
  );

  return (
    <div>
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '48px', fontWeight: 800, color: '#002a48', marginBottom: '8px' }}>My Voyages</h1>
      <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '18px', color: '#42474e', marginBottom: '32px' }}>Manage your group trips and keep the crew afloat.</p>

      {/* Create Group Form */}
      <section className="glass-card nautical-border p-6 md:p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(31,220,254,0.2)', color: '#006879' }}>
            <span className="material-symbols-outlined">sailing</span>
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48' }}>Create a New Voyage</h2>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ffdad6', color: '#93000a' }}>{error}</div>}

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-end">
          <div className="space-y-2">
            <label style={labelStyle}>Trip Name</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#72777f' }}>map</span>
              <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g., Bahamas Getaway" required
                     className="w-full pl-10 pr-4 py-3 rounded-t-lg transition-colors"
                     style={{ background: 'rgba(255,255,255,0.5)', border: 'none', borderBottom: '2px solid #c2c7cf', outline: 'none', fontFamily: "'Montserrat', sans-serif", fontSize: '16px', color: '#1a1c1f' }}
                     onFocus={e => e.target.style.borderBottomColor = '#732200'}
                     onBlur={e => e.target.style.borderBottomColor = '#c2c7cf'} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting}
                    className="btn-gradient flex items-center gap-2 px-8 py-3 shadow-lg"
                    style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined">anchor</span>}
              Set Sail (Create Trip)
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t" style={{ borderColor: 'rgba(194,199,207,0.3)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(115,34,0,0.1)', color: '#732200' }}>
              <span className="material-symbols-outlined">group_add</span>
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48' }}>Join an Existing Voyage</h2>
          </div>
          <form onSubmit={handleJoin} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-end">
            <div className="space-y-2">
              <label style={labelStyle}>Voyage ID</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#72777f' }}>key</span>
                <input type="text" value={joinGroupId} onChange={e => setJoinGroupId(e.target.value)} placeholder="Paste Voyage ID here..." required
                       className="w-full pl-10 pr-4 py-3 rounded-t-lg transition-colors"
                       style={{ background: 'rgba(255,255,255,0.5)', border: 'none', borderBottom: '2px solid #c2c7cf', outline: 'none', fontFamily: "'Montserrat', sans-serif", fontSize: '16px', color: '#1a1c1f' }}
                       onFocus={e => e.target.style.borderBottomColor = '#006879'}
                       onBlur={e => e.target.style.borderBottomColor = '#c2c7cf'} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isJoining}
                      className="flex items-center gap-2 px-8 py-3 shadow-lg rounded-lg transition-opacity"
                      style={{ background: '#732200', color: '#ffffff', fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', opacity: isJoining ? 0.7 : 1 }}>
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined">login</span>}
                Join Crew
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Groups', value: groups.length, color: '#002a48' },
          { label: 'Created', value: createdGroups.length, color: '#006879' },
          { label: 'Joined', value: joinedGroups.length, color: '#732200' },
        ].map((s, i) => (
          <div key={i} className="glass-card nautical-border !p-4">
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#42474e' }}>{s.label}</p>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Active Voyages */}
      <section>
        <h3 style={{ ...sectionTitle }}>
          <span className="material-symbols-outlined">explore</span> Active Voyages
        </h3>

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined mb-4 block" style={{ fontSize: '48px', color: '#c2c7cf' }}>sailing</span>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '16px', color: '#72777f' }}>No voyages yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, i) => {
              const isOwner = group.created_by === userId;
              const icons = ['directions_boat', 'sailing', 'waves', 'anchor', 'explore'];
              const bgColors = ['rgba(207,229,255,0.1)', 'rgba(255,219,207,0.1)', 'rgba(170,237,255,0.1)'];
              return (
                <a key={group.id} href={`/dashboard/groups/${group.id}`} className="block glass-card nautical-border p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
                  {/* Watermark icon */}
                  <div className="absolute -right-4 -top-4 pointer-events-none transition-transform group-hover:scale-110 duration-500"
                       style={{ opacity: 0.08, color: '#006879' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>{icons[i % icons.length]}</span>
                  </div>

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: '#002a48', marginBottom: '4px' }}>
                        {group.group_name}
                      </h4>
                      <div className="flex items-center gap-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '12px', fontWeight: 700, color: '#42474e' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group</span>
                        {group.group_members?.[0]?.count || 1} members
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center border"
                           style={{ background: bgColors[i % bgColors.length], color: '#00416a', borderColor: 'rgba(0,65,106,0.2)' }}>
                        <span className="material-symbols-outlined">{icons[i % icons.length]}</span>
                      </div>
                      {isOwner && (
                        <button onClick={() => handleDelete(group.id)}
                                className="p-2 rounded-full transition-all"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#72777f' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ba1a1a'; (e.currentTarget as HTMLButtonElement).style.background = '#ffdad6'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#72777f'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 flex justify-between items-center relative z-10"
                       style={{ borderTop: '1px solid rgba(194,199,207,0.3)' }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#1a1c1f' }}>
                      {new Date(group.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="px-3 py-1 rounded-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 600, color: isOwner ? '#005d6d' : '#42474e', background: isOwner ? 'rgba(170,237,255,0.2)' : '#ededf2' }}>
                      {isOwner ? 'Captain' : 'Crew'}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
