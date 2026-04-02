import { put, list, del, head } from "@vercel/blob";

export interface ScheduledPost {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  categoryId: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "failed";
  youtubeVideoId?: string;
  youtubeUrl?: string;
  error?: string;
  createdAt: string;
}

const SCHEDULE_PREFIX = "schedule/";

function metaPath(id: string) {
  return `${SCHEDULE_PREFIX}${id}.json`;
}

export async function saveScheduledPost(post: ScheduledPost): Promise<void> {
  await put(metaPath(post.id), JSON.stringify(post), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function getScheduledPost(id: string): Promise<ScheduledPost | null> {
  try {
    const blob = await head(metaPath(id));
    const res = await fetch(blob.url);
    return (await res.json()) as ScheduledPost;
  } catch {
    return null;
  }
}

export async function getAllScheduledPosts(): Promise<ScheduledPost[]> {
  const { blobs } = await list({ prefix: SCHEDULE_PREFIX });
  const posts: ScheduledPost[] = [];

  for (const blob of blobs) {
    if (blob.pathname.endsWith(".json")) {
      try {
        const res = await fetch(blob.url);
        const post = (await res.json()) as ScheduledPost;
        posts.push(post);
      } catch {
        // skip corrupt entries
      }
    }
  }

  return posts.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

export async function deleteScheduledPost(id: string): Promise<void> {
  try {
    await del(metaPath(id));
  } catch {
    // ignore
  }
}
