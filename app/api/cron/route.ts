import { NextRequest, NextResponse } from "next/server";
import { getAllScheduledPosts, saveScheduledPost } from "@/lib/store";
import { getAuthenticatedClient } from "@/lib/auth";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth = await getAuthenticatedClient();
  if (!auth) {
    return NextResponse.json({ message: "Not authenticated", updated: 0 });
  }

  const youtube = google.youtube({ version: "v3", auth });
  const posts = await getAllScheduledPosts();
  const scheduled = posts.filter((p) => p.status === "scheduled" && p.youtubeVideoId);

  let updated = 0;

  for (const post of scheduled) {
    try {
      const res = await youtube.videos.list({
        part: ["status"],
        id: [post.youtubeVideoId!],
      });

      const video = res.data.items?.[0];
      if (video?.status?.privacyStatus === "public") {
        post.status = "published";
        await saveScheduledPost(post);
        updated++;
      }
    } catch {
      // skip — will retry next cron run
    }
  }

  return NextResponse.json({
    message: `Checked ${scheduled.length} videos, updated ${updated}`,
    updated,
  });
}
