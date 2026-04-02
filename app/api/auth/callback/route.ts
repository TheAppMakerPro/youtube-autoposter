import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, verifyOAuthState } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Check if user denied consent
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    const description = request.nextUrl.searchParams.get("error_description") || "Access denied";
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(description)}`, request.url)
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  // Verify OAuth state to prevent CSRF
  const stateValid = await verifyOAuthState(state);
  if (!stateValid) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 403 });
  }

  try {
    await exchangeCode(code);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 }
    );
  }
}
