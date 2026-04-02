import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

const MAX_DOWNLOAD_SIZE = 512 * 1024 * 1024; // 512 MB
const ALLOWED_PROTOCOLS = ["https:", "http:"];

function validateUrl(urlString: string): URL {
  const url = new URL(urlString);

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  // Block private/internal IPs (SSRF protection)
  const hostname = url.hostname.toLowerCase();
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "169.254.169.254", // cloud metadata
    "metadata.google.internal",
    "[::1]",
  ];
  if (
    blocked.includes(hostname) ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.16.") ||
    hostname.startsWith("192.168.") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("URLs pointing to internal/private addresses are not allowed");
  }

  return url;
}

export async function downloadFromUrl(url: string): Promise<string> {
  const parsedUrl = validateUrl(url);
  const extMatch = path.extname(parsedUrl.pathname).replace(/[^a-zA-Z0-9.]/g, "");
  const ext = extMatch || ".mp4";
  const tempPath = path.join(os.tmpdir(), `yt-autoposter-${randomUUID()}${ext}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  // Check Content-Length if available
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_DOWNLOAD_SIZE) {
    throw new Error(`File too large: ${Math.round(parseInt(contentLength) / 1024 / 1024)} MB exceeds 512 MB limit`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_DOWNLOAD_SIZE) {
    throw new Error(`File too large: ${Math.round(buffer.length / 1024 / 1024)} MB exceeds 512 MB limit`);
  }

  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

export function cleanupTempFile(filePath: string) {
  try {
    // Ensure the file is within the temp directory
    const resolved = path.resolve(filePath);
    const tmpDir = path.resolve(os.tmpdir());
    if (!resolved.startsWith(tmpDir + path.sep) && resolved !== tmpDir) {
      return; // refuse to delete files outside tmp
    }
    if (resolved.includes("yt-autoposter-") && fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  } catch {
    // ignore cleanup errors
  }
}
