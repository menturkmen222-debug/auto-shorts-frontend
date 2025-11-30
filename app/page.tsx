// app/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUpload, FaCloud, FaClock, FaTrashAlt, FaQrcode } from "react-icons/fa";

const CHANNELS = [
  { id: "channel_1", name: "Main YouTube" },
  { id: "channel_2", name: "TikTok Daily" },
  { id: "channel_3", name: "Reels Hub" },
  { id: "channel_4", name: "Facebook Shorts" },
  { id: "channel_5", name: "Cross-Post" },
];

const PLATFORMS = [
  { id: "youtube", name: "YouTube" },
  { id: "tiktok", name: "TikTok" },
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
];

export default function UploadPage() {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message?: string; estTime?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [channelId, setChannelId] = useState(CHANNELS[0].id);
  const [platform, setPlatform] = useState(PLATFORMS[0].id);
  const [scheduledAt, setScheduledAt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt.trim()) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("prompt", prompt.trim());
    formData.append("channelId", channelId);
    formData.append("platform", platform);
    if (scheduledAt) formData.append("scheduledAt", scheduledAt);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadResult({ success: true, message: "✅ Video queued successfully!", estTime: data.estDisplay });
        // Tozalash
        setPrompt("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setUploadResult({ success: false, message: `❌ ${data.error || "Upload failed"}` });
      }
    } catch (err) {
      setUploadResult({ success: false, message: "❌ Network error. Please try again." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleButtonClick = (id: string) => {
    if (activeButton === id) {
      setActiveButton(null);
    } else {
      setActiveButton(id);
    }
  };

  // Icon-only vertical button komponenti
  const IconActionButton = ({ id, icon, label }: { id: string; icon: React.ReactNode; label: string }) => (
    <motion.button
      className={`flex items-center justify-center w-14 h-14 rounded-xl mb-3 shadow-md transition-colors ${
        activeButton === id
          ? "bg-blue-500 text-white"
          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
      }`}
      onClick={() => handleButtonClick(id)}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      {icon}
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Auto-Upload Studio</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chap tomon: Icon-only amal tugmalari (vertical) */}
          <div className="flex flex-col items-center space-y-3">
            <IconActionButton id="upload" icon={<FaUpload />} label="Upload" />
            <IconActionButton id="cloud" icon={<FaCloud />} label="Cloudinary" />
            <IconActionButton id="schedule" icon={<FaClock />} label="Schedule" />
            <IconActionButton id="delete" icon={<FaTrashAlt />} label="Auto-Delete" />
            <IconActionButton id="qr" icon={<FaQrcode />} label="QR Code" />
          </div>

          {/* O'ng tomon: Asosiy forma */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Video yuklash */}
                <div>
                  <label className="block text-sm font-medium mb-2">Video File</label>
                  <input
                    type="file"
                    accept="video/*"
                    required
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
                  />
                  {file && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selected: {file.name}</p>}
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium mb-2">AI Prompt (min. 10 chars)</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                    minLength={10}
                    placeholder="Describe the video content for AI metadata generation..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-gray-100"
                    rows={3}
                  />
                </div>

                {/* Platform & Channel */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Channel</label>
                    <select
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
                    >
                      {CHANNELS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Scheduling (optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Schedule (Optional – Up to 10 days ahead, AQSH EST time)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ⏰ Videos auto-scheduled to optimal US hours: 6AM, 10AM, 2PM, 6PM, 10PM EST
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isUploading || !file || prompt.trim().length < 10}
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    isUploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isUploading ? "Processing..." : "Queue Video"}
                </button>

                {/* Natija */}
                <AnimatePresence>
                  {uploadResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 rounded-lg mt-4 ${
                        uploadResult.success
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                      }`}
                    >
                      <p>{uploadResult.message}</p>
                      {uploadResult.estTime && (
                        <p className="text-sm mt-1">⏰ Scheduled for: {uploadResult.estTime} (EST)</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
