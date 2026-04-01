import { NextRequest, NextResponse } from "next/server";
import { uploadVideo } from "@/lib/youtube";
import { downloadFromUrl, cleanupTempFile } from "@/lib/download";
import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

export const maxDuration = 300; // 5 min timeout for large uploads

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

  try {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string | null;
    const categoryId = formData.get("categoryId") as string | null;
    const privacyStatus = (formData.get("privacyStatus") as string) || "public";
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

    // Resolve video path
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

    // Resolve thumbnail path
    let thumbnailPath: string | undefined;
    if (thumbnailFile) {
      thumbnailPath = path.join(os.tmpdir(), `yt-autoposter-thumb-${randomUUID()}-${thumbnailFile.name}`);
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      fs.writeFileSync(thumbnailPath, buffer);
      tempFiles.push(thumbnailPath);
    }

    const result = await uploadVideo({
      title,
      description,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      categoryId: categoryId || "22",
      privacyStatus: privacyStatus as "public" | "unlisted" | "private",
      publishAt: publishAt || undefined,
      videoPath,
      thumbnailPath,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Clean up temp files
    for (const f of tempFiles) {
      cleanupTempFile(f);
    }
  }
}
