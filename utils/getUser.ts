import jwt from "jsonwebtoken";
import { getDatabase } from "./mongodb";

export async function getUserFromRequest(req: { cookies?: Record<string, string> }) {
  const token = req.cookies?.token;
  if (!token) throw new Error("Not authenticated");

  const db  = await getDatabase("strava_db");

  let decoded: { sub: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
  } catch {
    throw new Error("Invalid or expired JWT");
  }

  const user = await db.collection("users").findOne({ stravaId: decoded.sub });
  if (!user) throw new Error("User not found");

  let accessToken = user.accessToken;
  const now = Math.floor(Date.now() / 1000);

  // Refresh Strava access token if expired
  if (user.expiresAt < now) {
    const apps = JSON.parse(process.env.STRAVA_APPS!);
    const appKeys = Object.keys(apps);
    const app = apps[appKeys[0]]; // select correct app if multiple

    const refreshResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: app.clientId,
        client_secret: app.clientSecret,
        grant_type: "refresh_token",
        refresh_token: user.refreshToken,
      }),
    });

    const refreshData = await refreshResponse.json();

    // Update DB
    await db.collection("users").updateOne(
      { stravaId: user.stravaId },
      {
        $set: {
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token,
          expiresAt: refreshData.expires_at,
        },
      }
    );

    accessToken = refreshData.access_token;
  }

  return { user, accessToken };
}
