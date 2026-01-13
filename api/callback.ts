import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDatabase } from "../utils/mongodb";
import { signJWT } from "../utils/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;
  const stateStr = req.query.state as string;
  if (!code || !stateStr) {
    res.status(400).send("Missing code/state");
    return;
  }

  const state = JSON.parse(Buffer.from(stateStr, "base64").toString("utf8"));
  const site = state.site;
  const STRAVA_APPS: Record<string, { clientId: string; clientSecret: string }> = JSON.parse(
    process.env.STRAVA_APPS!
  );
  const app = STRAVA_APPS[site];
  if (!app) {
    res.status(400).send("Invalid site");
    return;
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: app.clientId,
      client_secret: app.clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  const athleteId = tokenData.athlete.id;

  const db = await getDb();
  const tokens = db.collection("tokens");
  await tokens.updateOne(
    { athleteId, site },
    { $set: { ...tokenData, updatedAt: new Date() } },
    { upsert: true }
  );

  const jwtToken = signJWT({ athleteId, site }, "2h");
  res.setHeader(
    "Set-Cookie",
    `session=${jwtToken}; HttpOnly; Path=/; Max-Age=7200`
  );

  res.redirect(302, "/");
}
