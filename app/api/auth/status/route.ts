import { NextResponse } from "next/server";
import { isAuthenticated, getAuthenticatedClient } from "@/lib/auth";
import { google } from "googleapis";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return NextResponse.json({ authenticated: false });
    }

    const youtube = google.youtube({ version: "v3", auth });
    const response = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    });

    const channel = response.data.items?.[0];
    return NextResponse.json({
      authenticated: true,
      channel: channel
        ? {
            title: channel.snippet?.title,
            thumbnail: channel.snippet?.thumbnails?.default?.url,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
