import { NextRequest, NextResponse } from "next/server";
import { uploadVideo } from "@/lib/youtube";
import { downloadFromUrl, cleanupTempFile } from "@/lib/download";
import { isAuthenticated } from "@/lib/auth";
import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

export const maxDuration = 300;

const VALID_PRIVACY = ["public", "unlisted", "private"] as const;

function safeTempPath(prefix: string): string {
  return path.join(os.tmpdir(), `yt-autoposter-${prefix}-${randomUUID()}`);
}

export async function POST(request: NextRequest) {
  // Auth check
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tempFiles: string[] = [];

  try {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string | null;
    const categoryId = formData.get("categoryId") as string | null;
    const privacyStatusRaw = (formData.get("privacyStatus") as string) || "public";
    const publishAt = formData.get("publishAt") as string | null;
    const videoFile = formData.get("videoFile") as File | null;
    const videoUrl = formData.get("videoUrl") as string | null;
    const thumbnailFile = formData.get("thumbnailFile") as File | null;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    if (!videoFile && !videoUrl) {
      return NextResponse.json(
        { error: "Either a video file or video URL is required" },
        { status: 400 }
      );
    }

    // Validate privacy status
    if (!VALID_PRIVACY.includes(privacyStatusRaw as typeof VALID_PRIVACY[number])) {
      return NextResponse.json(
        { error: "Privacy must be public, unlisted, or private" },
        { status: 400 }
      );
    }
    const privacyStatus = privacyStatusRaw as typeof VALID_PRIVACY[number];

    // Validate publishAt is in the future if provided
    if (publishAt) {
      const publishDate = new Date(publishAt);
      const fifteenMinFromNow = new Date(Date.now() + 15 * 60 * 1000);
      if (isNaN(publishDate.getTime()) || publishDate < fifteenMinFromNow) {
        return NextResponse.json(
          { error: "Scheduled publish time must be at least 15 minutes in the future" },
          { status: 400 }
        );
      }
    }

    // Resolve video path (sanitized filenames — use UUID only)
    let videoPath: string;
    if (videoFile) {
      videoPath = safeTempPath("vid");
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      fs.writeFileSync(videoPath, buffer);
      tempFiles.push(videoPath);
    } else {
      videoPath = await downloadFromUrl(videoUrl!);
      tempFiles.push(videoPath);
    }

    // Resolve thumbnail path (sanitized)
    let thumbnailPath: string | undefined;
    if (thumbnailFile) {
      thumbnailPath = safeTempPath("thumb");
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      fs.writeFileSync(thumbnailPath, buffer);
      tempFiles.push(thumbnailPath);
    }

    const result = await uploadVideo({
      title,
      description,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      categoryId: categoryId || "22",
      privacyStatus,
      publishAt: publishAt || undefined,
      videoPath,
      thumbnailPath,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    const msg = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    for (const f of tempFiles) {
      cleanupTempFile(f);
    }
  }
}
