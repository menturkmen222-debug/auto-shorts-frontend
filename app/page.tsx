'use client';

import { useEffect, useState } from 'react';

const CHANNELS = [
  { id: "tech_buni", name: "Tech Buni" },
  { id: "cooking_buni", name: "Cooking Buni" },
  { id: "travel_buni", name: "Travel Buni" },
  { id: "gaming_buni", name: "Gaming Buni" },
  { id: "life_buni", name: "Life Buni" },
];

interface StatItem {
  channelName: string;
  pending: number;
  uploaded: number;
  failed: number;
  todayUploaded: number;
}

export default function DashboardPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Stat fetch error:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('https://tm-auto.deno.dev/upload-video', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✅ Video qabul qilindi! 4 ta tarmoqqa AQSH soatiga mos joylanadi.`,
        });
        e.currentTarget.reset();
        const res = await fetch('/api/stats');
        if (res.ok) setStats(await res.json());
      } else {
        throw new Error(result.error || 'Yuklashda xatolik');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '1.5rem auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '24px' }}>
        AI Shorts Auto System
      </h1>

      <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Yangi Video Yuklash</h2>
        {message && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              marginBottom: '16px',
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Prompt *</label>
            <textarea
              name="prompt"
              placeholder="Masalan: AI cooking in space kitchen"
              required
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Kanal *</label>
            <select
              name="channelName"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            >
              <option value="">Tanlang...</option>
              {CHANNELS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Video fayl yoki URL *
            </label>
            <input
              type="file"
              name="video"
              accept="video/*"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                marginBottom: '8px',
              }}
            />
            <input
              type="url"
              name="videoUrl"
              placeholder="Yoki video URL (https://...)"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Fayl yoki URL dan bittasini kiriting.
            </p>
          </div>

          <p style={{ fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>
            🕒 Video avtomatik ravishda AQSH auditoriyasi uchun optimal soatlarga (6 AM, 10 AM, 2 PM, 6 PM, 10 PM EST) moslab, 4 ta tarmoqqa joylanadi.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '10px 16px',
              background: isSubmitting ? '#93c5fd' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Yuborilmoqda...' : 'Videoni Yuklash'}
          </button>
        </form>
      </div>

      <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Kanal Statistikasi</h2>
        {loadingStats ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Yuklanmoqda...</p>
        ) : stats.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Ma'lumot yo'q.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {stats.map((item, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>
                  {CHANNELS.find(c => c.id === item.channelName)?.name}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
                  <span>⏳ Navbatda: <b>{item.pending}</b></span>
                  <span>✅ Yuklangan: <b>{item.uploaded}</b></span>
                  <span>❌ Xatolik: <b>{item.failed}</b></span>
                  <span>📅 Bugun: <b>{item.todayUploaded}/5</b></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
