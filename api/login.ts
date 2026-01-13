import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const site = req.query.site as string;
  const STRAVA_APPS: Record<string, { clientId: string }> = JSON.parse(
    process.env.STRAVA_APPS!
  );
  if (!site || !STRAVA_APPS[site]) {
    res.status(400).send("Invalid site");
    return;
  }

  const state = Buffer.from(JSON.stringify({ site })).toString("base64");
  const redirectUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_APPS[site].clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    `${process.env.BASE_URL}/api/callback`
  )}&scope=read,activity:read&state=${state}`;

  res.redirect(302, redirectUrl);
}
