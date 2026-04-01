import { google } from "googleapis";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

interface SessionData {
  tokens?: {
    access_token?: string | null;
    refresh_token?: string | null;
    scope?: string;
    token_type?: string | null;
    expiry_date?: number | null;
  };
}

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long_replace_me",
  cookieName: "yt-autoposter-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/callback"
  );
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function exchangeCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  const session = await getSession();
  session.tokens = tokens;
  await session.save();
  return tokens;
}

export async function getAuthenticatedClient() {
  const session = await getSession();
  if (!session.tokens) {
    return null;
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(session.tokens);

  // Auto-refresh if expired
  oauth2Client.on("tokens", async (newTokens) => {
    const merged = { ...session.tokens, ...newTokens };
    session.tokens = merged;
    await session.save();
  });

  return oauth2Client;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session.tokens;
}

export async function clearTokens(): Promise<void> {
  const session = await getSession();
  session.tokens = undefined;
  await session.save();
}
