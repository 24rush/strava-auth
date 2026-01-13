import jwt from "jsonwebtoken";
import { Collection } from "mongodb";

const STRAVA_APPS: Record<string, { clientId: string; clientSecret: string }> = JSON.parse(
  process.env.STRAVA_APPS!
);
const JWT_SECRET = process.env.JWT_SECRET!;

export function signJWT(payload: object, expiresIn = "2h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function refreshStravaToken(
  site: string,
  athleteId: number,
  tokensCollection: Collection
) {
  const tokenData = await tokensCollection.findOne({ athleteId, site });
  if (!tokenData) return null;

  const now = Math.floor(Date.now() / 1000);
  if (tokenData.expires_at > now + 60) {
    return tokenData.access_token;
  }

  const siteApp = STRAVA_APPS[site];
  if (!siteApp) return null;

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: siteApp.clientId,
      client_secret: siteApp.clientSecret,
      grant_type: "refresh_token",
      refresh_token: tokenData.refresh_token,
    }),
  });

  const newData = await res.json();
  await tokensCollection.updateOne(
    { athleteId, site },
    { $set: { ...newData, updatedAt: new Date() } },
    { upsert: true }
  );

  return newData.access_token;
}
