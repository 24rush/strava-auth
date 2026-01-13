import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { site } = req.query;

  const apps = JSON.parse(process.env.STRAVA_APPS!);
  const app = apps[site as string];

  if (!app) return res.status(400).send("Invalid site");

  const redirectUri = `${process.env.BASE_URL}/api/callback?site=${site}`;
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${app.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=read,activity:read&approval_prompt=auto`;

  res.redirect(stravaAuthUrl);
}
