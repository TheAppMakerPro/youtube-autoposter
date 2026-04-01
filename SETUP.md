# YouTube Auto-Poster — Setup Guide

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown (top bar) → **New Project**
3. Name it `syncro-link-autoposter` → **Create**
4. Select the new project from the dropdown

## 2. Enable YouTube Data API v3

1. Go to **APIs & Services → Library**
2. Search for **YouTube Data API v3**
3. Click it → **Enable**

## 3. Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → **Create**
3. Fill in required fields:
   - **App name**: `Syncro-Link Auto-Poster`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue** through all steps
5. On the **Test users** page, add the Google account that owns the `@Syncro-Link-999` YouTube channel
6. Click **Save and Continue** → **Back to Dashboard**

## 4. Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Syncro-Link Auto-Poster`
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/callback
   ```
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

## 5. Configure the App

1. Open `.env.local` in the project root
2. Replace the placeholder values:
   ```
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
   ```

## 6. Run the App

```bash
cd youtube-autoposter
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Connect YouTube Account** to authenticate.

## Notes

- The app runs **locally only** — your OAuth tokens are stored at `~/.yt-autoposter-tokens.json`
- While in test mode, only the Google accounts listed as test users can authenticate
- To make it available to any Google account, publish the OAuth consent screen (requires Google verification)
- YouTube API has a default quota of **10,000 units/day** — each video upload costs ~1,600 units, so you can upload ~6 videos per day
