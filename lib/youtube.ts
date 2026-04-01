import { google } from "googleapis";
import { getAuthenticatedClient } from "./auth";
import fs from "fs";
import { Readable } from "stream";

export interface UploadOptions {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus: "public" | "unlisted" | "private";
  publishAt?: string;
  videoPath: string;
  thumbnailPath?: string;
}

export async function uploadVideo(options: UploadOptions) {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    throw new Error("Not authenticated. Please connect your YouTube account.");
  }

  const youtube = google.youtube({ version: "v3", auth });

  const fileStream = fs.createReadStream(options.videoPath);
  const fileSize = fs.statSync(options.videoPath).size;

  const res = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: options.title,
          description: options.description,
          tags: options.tags,
          categoryId: options.categoryId || "22",
        },
        status: {
          privacyStatus: options.privacyStatus,
          ...(options.publishAt && options.privacyStatus === "private"
            ? { publishAt: options.publishAt }
            : {}),
        },
      },
      media: {
        body: fileStream as unknown as Readable,
      },
    },
    {
      onUploadProgress: (evt: { bytesRead: number }) => {
        const progress = (evt.bytesRead / fileSize) * 100;
        console.log(`Upload progress: ${Math.round(progress)}%`);
      },
    }
  );

  const videoId = res.data.id;

  // Upload thumbnail if provided
  if (options.thumbnailPath && videoId) {
    const thumbStream = fs.createReadStream(options.thumbnailPath);
    await youtube.thumbnails.set({
      videoId,
      media: {
        body: thumbStream as unknown as Readable,
      },
    });
  }

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
