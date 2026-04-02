"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

interface ScheduledPost {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  categoryId: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "failed";
  youtubeUrl?: string;
  error?: string;
  createdAt: string;
}

// ─── Video Form (reused by Post Now and Schedule tabs) ───

function VideoForm({
  onSubmit,
  submitLabel,
  submitting,
  progress,
  showSchedule,
}: {
  onSubmit: (data: FormData) => void;
  submitLabel: string;
  submitting: boolean;
  progress: number;
  showSchedule: boolean;
}) {
  const [videoSource, setVideoSource] = useState<"file" | "url">("file");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("22");
  const [scheduledAt, setScheduledAt] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (tags) formData.append("tags", tags);
    formData.append("categoryId", categoryId);
    if (showSchedule && scheduledAt) {
      formData.append("scheduledAt", new Date(scheduledAt).toISOString());
    }
    if (videoSource === "file" && videoFile) {
      formData.append("videoFile", videoFile);
    } else if (videoSource === "url" && videoUrl) {
      formData.append("videoUrl", videoUrl);
    }
    if (thumbnailFile) {
      formData.append("thumbnailFile", thumbnailFile);
    }
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
              <p className="text-accent text-sm">
                {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
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
          rows={4}
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
      </div>

      {/* Category */}
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

      {/* Schedule Date/Time */}
      {showSchedule && (
        <div>
          <label className="block text-sm font-medium mb-2">Post Date & Time *</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
          />
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
      {submitting && (
        <div className="space-y-2">
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-foreground/50 text-center">
            {progress < 90 ? "Processing..." : progress < 100 ? "Finalizing..." : "Done!"}
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || (!videoFile && !videoUrl) || !title || !description}
        className="w-full bg-accent text-black font-semibold py-3 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {submitting ? "Processing..." : submitLabel}
      </button>
    </form>
  );
}

// ─── Calendar Component ───

function Calendar({ posts, onDelete }: { posts: ScheduledPost[]; onDelete: (id: string) => void }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  // Group posts by day
  const postsByDay: Record<number, ScheduledPost[]> = {};
  for (const post of posts) {
    const d = new Date(post.scheduledAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!postsByDay[day]) postsByDay[day] = [];
      postsByDay[day].push(post);
    }
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const statusColors: Record<string, string> = {
    scheduled: "bg-accent",
    published: "bg-success",
    failed: "bg-error",
  };

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedPosts = selectedDay ? postsByDay[selectedDay] || [] : [];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="text-foreground/50 hover:text-accent transition-colors px-3 py-1">
          &larr;
        </button>
        <h3 className="text-lg font-semibold">{monthName}</h3>
        <button onClick={nextMonth} className="text-foreground/50 hover:text-accent transition-colors px-3 py-1">
          &rarr;
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-foreground/40 font-medium">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayPosts = postsByDay[day] || [];
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                isSelected
                  ? "bg-accent/20 border border-accent"
                  : isToday
                  ? "bg-surface-hover border border-border"
                  : "hover:bg-surface-hover"
              }`}
            >
              <span className={isToday ? "text-accent font-bold" : ""}>{day}</span>
              {dayPosts.length > 0 && (
                <div className="flex gap-0.5">
                  {dayPosts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className={`w-1.5 h-1.5 rounded-full ${statusColors[p.status]}`}
                    />
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[8px] text-foreground/40">+{dayPosts.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-foreground/50 pt-2 border-t border-border">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Scheduled</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Published</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" /> Failed</span>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && (
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium text-foreground/70">
            {monthName.split(" ")[0]} {selectedDay} &mdash; {selectedPosts.length} video{selectedPosts.length !== 1 ? "s" : ""}
          </h4>
          {selectedPosts.length === 0 && (
            <p className="text-xs text-foreground/30">No videos scheduled for this day.</p>
          )}
          {selectedPosts.map((post) => (
            <div
              key={post.id}
              className="bg-surface border border-border rounded-lg p-3 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{post.title}</p>
                <p className="text-xs text-foreground/40">
                  {new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" "}&middot;{" "}
                  <span className={`${
                    post.status === "published" ? "text-success" :
                    post.status === "failed" ? "text-error" :
                    "text-accent"
                  }`}>
                    {post.status}
                  </span>
                </p>
                {post.youtubeUrl && (
                  <a href={post.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                    View on YouTube
                  </a>
                )}
                {post.error && <p className="text-xs text-error mt-1">{post.error}</p>}
              </div>
              <button
                onClick={() => onDelete(post.id)}
                className="text-foreground/30 hover:text-error transition-colors text-xs shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Queue List ───

function QueueList({
  posts,
  onDelete,
}: {
  posts: ScheduledPost[];
  onDelete: (id: string) => void;
}) {
  const upcoming = posts.filter((p) => p.status === "scheduled");
  const past = posts.filter((p) => p.status === "published" || p.status === "failed");

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground/70">
        Upcoming ({upcoming.length})
      </h3>
      {upcoming.length === 0 && (
        <p className="text-xs text-foreground/30 bg-surface border border-border rounded-lg p-4 text-center">
          No videos in the queue. Use the Schedule tab to add videos.
        </p>
      )}
      {upcoming.map((post) => (
        <div key={post.id} className="bg-surface border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{post.title}</p>
              <p className="text-xs text-foreground/40 mt-1">
                {new Date(post.scheduledAt).toLocaleString()} &middot;{" "}
                <span className="text-accent">
                  {post.status}
                </span>
              </p>
            </div>
            <button
              onClick={() => onDelete(post.id)}
              className="text-foreground/30 hover:text-error transition-colors text-sm shrink-0"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {past.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-foreground/70 pt-2">
            History ({past.length})
          </h3>
          {past.map((post) => (
            <div key={post.id} className="bg-surface border border-border rounded-lg p-4 space-y-1">
              <p className="font-medium truncate">{post.title}</p>
              <p className="text-xs text-foreground/40">
                {new Date(post.scheduledAt).toLocaleString()} &middot;{" "}
                <span className={post.status === "published" ? "text-success" : "text-error"}>
                  {post.status}
                </span>
              </p>
              {post.youtubeUrl && (
                <a href={post.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                  View on YouTube
                </a>
              )}
              {post.error && <p className="text-xs text-error">{post.error}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Main Page ───

type Tab = "post" | "schedule" | "calendar" | "queue";

export default function Home() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [tab, setTab] = useState<Tab>("post");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [scheduleMsg, setScheduleMsg] = useState("");
  const [posts, setPosts] = useState<ScheduledPost[]>([]);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setAuth)
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  const loadSchedule = useCallback(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (auth?.authenticated) {
      loadSchedule();
      const interval = setInterval(loadSchedule, 30000);
      return () => clearInterval(interval);
    }
  }, [auth, loadSchedule]);

  // Post Now handler
  async function handlePostNow(formData: FormData) {
    setError("");
    setResult(null);
    setUploading(true);
    setProgress(0);

    formData.append("privacyStatus", "public");

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

  // Schedule handler
  async function handleSchedule(formData: FormData) {
    setError("");
    setScheduleMsg("");
    setUploading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 5, 90));
    }, 500);

    try {
      const res = await fetch("/api/schedule", { method: "POST", body: formData });
      clearInterval(progressInterval);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to schedule");
      }
      setProgress(100);
      setScheduleMsg("Video scheduled successfully! Check the Calendar or Queue tab.");
      loadSchedule();
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setUploading(false);
    }
  }

  // Delete handler
  async function handleDelete(id: string) {
    try {
      await fetch("/api/schedule", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      loadSchedule();
    } catch {
      // ignore
    }
  }

  if (auth === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-accent animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "post", label: "Post Now" },
    { id: "schedule", label: "Schedule" },
    { id: "calendar", label: "Calendar" },
    { id: "queue", label: "Queue" },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6">
        <h1 className="text-3xl font-bold text-accent tracking-tight">Syncro-Link</h1>
        <p className="text-sm text-foreground/60 mt-1">YouTube Auto-Poster</p>
      </div>

      {!auth.authenticated ? (
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
        <div className="w-full max-w-2xl">
          {/* Channel info */}
          {auth.channel && (
            <div className="flex items-center gap-3 bg-surface border border-border rounded-lg p-3 mb-4">
              {auth.channel.thumbnail && (
                <img src={auth.channel.thumbnail} alt="" className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm text-foreground/70">
                Connected: <span className="text-accent font-medium">{auth.channel.title}</span>
              </span>
              <span className="ml-auto text-xs text-foreground/30">{posts.filter(p => p.status === "scheduled").length} scheduled</span>
            </div>
          )}

          {/* Tab Bar */}
          <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 mb-6">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(""); setResult(null); setScheduleMsg(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  tab === t.id
                    ? "bg-accent text-black"
                    : "text-foreground/50 hover:text-foreground/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-lg p-3 mb-4">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}
          {result && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4 space-y-1">
              <p className="text-success font-medium">Video uploaded successfully!</p>
              <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline block">
                {result.videoUrl}
              </a>
            </div>
          )}
          {scheduleMsg && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-3 mb-4">
              <p className="text-success text-sm">{scheduleMsg}</p>
            </div>
          )}

          {/* Tab Content */}
          {tab === "post" && (
            <VideoForm
              onSubmit={handlePostNow}
              submitLabel="Post to YouTube Now"
              submitting={uploading}
              progress={progress}
              showSchedule={false}
            />
          )}

          {tab === "schedule" && (
            <VideoForm
              onSubmit={handleSchedule}
              submitLabel="Add to Schedule"
              submitting={uploading}
              progress={progress}
              showSchedule={true}
            />
          )}

          {tab === "calendar" && (
            <Calendar posts={posts} onDelete={handleDelete} />
          )}

          {tab === "queue" && (
            <QueueList posts={posts} onDelete={handleDelete} />
          )}
        </div>
      )}
    </main>
  );
}
