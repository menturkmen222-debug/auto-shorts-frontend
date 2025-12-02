'use client';

import { useEffect, useState, useRef } from 'react';

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

interface UploadProgress {
  id: string;
  filename: string;
  loaded: number;
  total: number;
  status: 'uploading' | 'success' | 'failed' | 'retrying';
  message?: string;
}

export default function DashboardPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const uploadIdRef = useRef(0);

  // Statistika yuklash
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
    const interval = setInterval(fetchStats, 10000); // 10 soniyada
    return () => clearInterval(interval);
  }, []);

  // Real-time upload handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const videoFile = formData.get("video") as File;
    const videoUrl = formData.get("videoUrl")?.toString().trim() || "";
    const prompt = formData.get("prompt")?.toString() || "";
    const channelName = formData.get("channelName")?.toString() || "";

    if (!prompt || !channelName) {
      alert("Prompt va kanal majburiy");
      return;
    }

    if (!videoFile?.name && !videoUrl) {
      alert("Fayl yoki URL kiriting");
      return;
    }

    const id = `upload-${uploadIdRef.current++}`;
    const filename = videoFile?.name || (videoUrl ? "URL video" : "Unknown");

    // Yangi yuklanish qo'shish
    setUploads(prev => [...prev, { id, filename, loaded: 0, total: 0, status: 'uploading' }]);

    try {
      if (videoFile?.name) {
        await uploadFile(id, videoFile, prompt, channelName);
      } else if (videoUrl) {
        await uploadByUrl(id, videoUrl, prompt, channelName);
      }
    } catch (err: any) {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'failed', message: err.message } : u));
    }
  };

  // Faylni yuklash (real progress)
  const uploadFile = async (id: string, file: File, prompt: string, channelName: string) => {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("prompt", prompt);
    formData.append("channelName", channelName);

    try {
      const controller = new AbortController();
      const signal = controller.signal;

      const response = await fetch('https://autotm.deno.dev/upload-video', {
        method: 'POST',
        body: formData,
        signal,
        // Progress monitoring (fetch o'zida progressni qo'llab-quvvatlamaydi)
        // Shu sababli biz faqat "yuklandi/yuklanmadi" ni ko'rsatamiz
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'success' } : u));

      // Statistika yangilash
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      // Retry logic (1 marta)
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'retrying' } : u));
      setTimeout(async () => {
        try {
          const retryRes = await fetch('https://autotm.deno.dev/upload-video', {
            method: 'POST',
            body: formData,
          });
          if (retryRes.ok) {
            setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'success' } : u));
            const res = await fetch('/api/stats');
            if (res.ok) setStats(await res.json());
          } else {
            throw new Error('Retry failed');
          }
        } catch (retryErr: any) {
          setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'failed', message: retryErr.message } : u));
        }
      }, 2000);
    }
  };

  // URL orqali yuklash
  const uploadByUrl = async (id: string, url: string, prompt: string, channelName: string) => {
    const formData = new FormData();
    formData.append("videoUrl", url);
    formData append("prompt", prompt);
    formData.append("channelName", channelName);

    try {
      const res = await fetch('https://autotm.deno.dev/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'success' } : u));
      const statRes = await fetch('/api/stats');
      if (statRes.ok) setStats(await statRes.json());
    } catch (err: any) {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'failed', message: err.message } : u));
    }
  };

  // Format MB
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ maxWidth: '900px', margin: '1.5rem auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '24px' }}>
        AI Shorts Auto System
      </h1>

      {/* Real-time Upload Monitoring */}
      {uploads.length > 0 && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '12px' }}>Yuklanayotgan videolar</h3>
          {uploads.map(upload => (
            <div key={upload.id} style={{ marginBottom: '12px', padding: '12px', background: '#dbeafe', borderRadius: '8px' }}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{upload.filename}</div>
              {upload.status === 'uploading' && (
                <div style={{ fontSize: '13px', color: '#1e40af', marginTop: '4px' }}>
                  Yuklanmoqda...
                </div>
              )}
              {upload.status === 'retrying' && (
                <div style={{ fontSize: '13px', color: '#b45309', marginTop: '4px' }}>
                  Qayta urinilmoqda...
                </div>
              )}
              {upload.status === 'success' && (
                <div style={{ fontSize: '13px', color: '#047857', marginTop: '4px' }}>
                  ✅ Muvaffaqiyatli yuklandi!
                </div>
              )}
              {upload.status === 'failed' && (
                <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '4px' }}>
                  ❌ Xato: {upload.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Yangi Video Yuklash</h2>

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
              placeholder="Yoki video URL (https://drive.google.com/uc?export=download&id=...)"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Fayl yoki URL dan bittasini kiriting. Google Drive uchun "uc?export=download&id=..." formatidan foydalaning.
            </p>
          </div>

          <p style={{ fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>
            🕒 Video avtomatik ravishda AQSH auditoriyasi uchun optimal soatlarga (6 AM, 10 AM, 2 PM, 6 PM, 10 PM EST) moslab, 4 ta tarmoqqa joylanadi.
          </p>

          <button
            type="submit"
            style={{
              padding: '10px 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Videoni Yuklash
          </button>
        </form>
      </div>

      <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Kanal Statistikasi (Real-Time)</h2>
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
