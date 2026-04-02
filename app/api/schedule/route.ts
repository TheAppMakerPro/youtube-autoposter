import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  saveScheduledPost,
  getAllScheduledPosts,
  deleteScheduledPost,
  type ScheduledPost,
} from "@/lib/store";
import { uploadVideo } from "@/lib/youtube";
import { downloadFromUrl, cleanupTempFile } from "@/lib/download";
import fs from "fs";
import path from "path";
import os from "os";

export const maxDuration = 300;

export async function GET() {
  try {
    const posts = await getAllScheduledPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Failed to fetch schedule:", error);
    return NextResponse.json({ posts: [] });
  }
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

  try {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string | null;
    const categoryId = (formData.get("categoryId") as string) || "22";
    const scheduledAt = formData.get("scheduledAt") as string;
    const videoFile = formData.get("videoFile") as File | null;
    const videoUrl = formData.get("videoUrl") as string | null;
    const thumbnailFile = formData.get("thumbnailFile") as File | null;

    if (!title || !description || !scheduledAt) {
      return NextResponse.json(
        { error: "Title, description, and scheduled date are required" },
        { status: 400 }
      );
    }

    if (!videoFile && !videoUrl) {
      return NextResponse.json(
        { error: "Either a video file or video URL is required" },
        { status: 400 }
      );
    }

    // Resolve video to a temp file
    let videoPath: string;
    if (videoFile) {
      videoPath = path.join(os.tmpdir(), `yt-autoposter-${randomUUID()}-${videoFile.name}`);
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      fs.writeFileSync(videoPath, buffer);
      tempFiles.push(videoPath);
    } else {
      videoPath = await downloadFromUrl(videoUrl!);
      tempFiles.push(videoPath);
    }

    // Resolve thumbnail
    let thumbnailPath: string | undefined;
    if (thumbnailFile) {
      thumbnailPath = path.join(os.tmpdir(), `yt-autoposter-thumb-${randomUUID()}-${thumbnailFile.name}`);
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      fs.writeFileSync(thumbnailPath, buffer);
      tempFiles.push(thumbnailPath);
    }

    // Upload to YouTube immediately as PRIVATE with publishAt
    // YouTube will auto-publish at the scheduled time
    const result = await uploadVideo({
      title,
      description,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      categoryId,
      privacyStatus: "private",
      publishAt: new Date(scheduledAt).toISOString(),
      videoPath,
      thumbnailPath,
    });

    const id = randomUUID();
    const post: ScheduledPost = {
      id,
      title,
      description,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      categoryId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      status: "scheduled",
      youtubeVideoId: result.videoId ?? undefined,
      youtubeUrl: result.videoUrl,
      createdAt: new Date().toISOString(),
    };

    await saveScheduledPost(post);

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Failed to schedule post:", error);
    const message = error instanceof Error ? error.message : "Failed to schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    for (const f of tempFiles) {
      cleanupTempFile(f);
    }
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    await deleteScheduledPost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete scheduled post:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
