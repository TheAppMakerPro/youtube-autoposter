"use client";

import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "1", name: "Film & Animation" },
  { id: "2", name: "Autos & Vehicles" },
  { id: "10", name: "Music" },
  { id: "15", name: "Pets & Animals" },
  { id: "17", name: "Sports" },
  { id: "20", name: "Gaming" },
  { id: "22", name: "People & Blogs" },
  { id: "23", name: "Comedy" },
  { id: "24", name: "Entertainment" },
  { id: "25", name: "News & Politics" },
  { id: "26", name: "Howto & Style" },
  { id: "27", name: "Education" },
  { id: "28", name: "Science & Technology" },
  { id: "29", name: "Nonprofits & Activism" },
];

interface AuthStatus {
  authenticated: boolean;
  channel?: { title: string; thumbnail: string } | null;
}

interface UploadResult {
  videoId: string;
  videoUrl: string;
}

export default function Home() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [videoSource, setVideoSource] = useState<"file" | "url">("file");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("22");
  const [privacyStatus, setPrivacyStatus] = useState<"public" | "unlisted" | "private">("public");
  const [publishAt, setPublishAt] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setAuth)
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (tags) formData.append("tags", tags);
    formData.append("categoryId", categoryId);
    formData.append("privacyStatus", privacyStatus);
    if (privacyStatus === "private" && publishAt) {
      formData.append("publishAt", new Date(publishAt).toISOString());
    }
    if (videoSource === "file" && videoFile) {
      formData.append("videoFile", videoFile);
    } else if (videoSource === "url" && videoUrl) {
      formData.append("videoUrl", videoUrl);
    }
    if (thumbnailFile) {
      formData.append("thumbnailFile", thumbnailFile);
    }

    // Simulate progress since we can't track server-side upload from client
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 1000);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setProgress(100);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (auth === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-accent animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <h1 className="text-3xl font-bold text-accent tracking-tight">
          Syncro-Link
        </h1>
        <p className="text-sm text-foreground/60 mt-1">YouTube Auto-Poster</p>
      </div>

      {!auth.authenticated ? (
        /* Auth Screen */
        <div className="w-full max-w-2xl bg-surface border border-border rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">&#9654;</div>
          <h2 className="text-xl font-semibold mb-2">Connect Your YouTube Account</h2>
          <p className="text-foreground/50 mb-6 text-sm">
            Authorize access to upload videos to the Syncro-Link channel.
          </p>
          <a
            href="/api/auth/login"
            className="inline-block bg-accent text-black font-semibold px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors"
          >
            Connect YouTube Account
          </a>
        </div>
      ) : (
        /* Upload Form */
        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-5">
          {/* Connected channel info */}
          {auth.channel && (
            <div className="flex items-center gap-3 bg-surface border border-border rounded-lg p-3">
              {auth.channel.thumbnail && (
                <img
                  src={auth.channel.thumbnail}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-foreground/70">
                Connected: <span className="text-accent font-medium">{auth.channel.title}</span>
              </span>
            </div>
          )}

          {/* Video Source Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">Video Source</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVideoSource("file")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  videoSource === "file"
                    ? "bg-accent text-black"
                    : "bg-surface border border-border text-foreground/70 hover:bg-surface-hover"
                }`}
              >
                Local File
              </button>
              <button
                type="button"
                onClick={() => setVideoSource("url")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  videoSource === "url"
                    ? "bg-accent text-black"
                    : "bg-surface border border-border text-foreground/70 hover:bg-surface-hover"
                }`}
              >
                From URL
              </button>
            </div>
          </div>

          {/* Video Input */}
          {videoSource === "file" ? (
            <div>
              <label className="block text-sm font-medium mb-2">Video File *</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-surface border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 transition-colors"
              >
                {videoFile ? (
                  <p className="text-accent text-sm">{videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                ) : (
                  <p className="text-foreground/40 text-sm">Click to select a video file</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">Video URL *</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
              placeholder="Video title"
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-foreground/30 mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              placeholder="Video description..."
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors resize-y"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-foreground/30 mt-1">Comma-separated</p>
          </div>

          {/* Category & Privacy Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Privacy</label>
              <select
                value={privacyStatus}
                onChange={(e) => setPrivacyStatus(e.target.value as "public" | "unlisted" | "private")}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* Scheduled Publish (only for private) */}
          {privacyStatus === "private" && (
            <div>
              <label className="block text-sm font-medium mb-2">Schedule Publish</label>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              />
              <p className="text-xs text-foreground/30 mt-1">Leave empty to keep as private</p>
            </div>
          )}

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail</label>
            <div
              onClick={() => thumbInputRef.current?.click()}
              className="bg-surface border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent/50 transition-colors"
            >
              {thumbnailFile ? (
                <p className="text-accent text-sm">{thumbnailFile.name}</p>
              ) : (
                <p className="text-foreground/40 text-sm">Click to select a thumbnail image</p>
              )}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-foreground/50 text-center">
                {progress < 90 ? "Uploading to YouTube..." : progress < 100 ? "Finalizing..." : "Done!"}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-lg p-3">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Success */}
          {result && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 space-y-2">
              <p className="text-success font-medium">Video uploaded successfully!</p>
              <a
                href={result.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent text-sm hover:underline block"
              >
                {result.videoUrl}
              </a>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || (!videoFile && !videoUrl) || !title || !description}
            className="w-full bg-accent text-black font-semibold py-3 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Post to YouTube"}
          </button>
        </form>
      )}
    </main>
  );
}
