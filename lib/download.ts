import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

export async function downloadFromUrl(url: string): Promise<string> {
  const ext = path.extname(new URL(url).pathname) || ".mp4";
  const tempPath = path.join(os.tmpdir(), `yt-autoposter-${randomUUID()}${ext}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(tempPath, buffer);

  return tempPath;
}

export function cleanupTempFile(filePath: string) {
  try {
    if (filePath.includes("yt-autoposter-") && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore cleanup errors
  }
}
