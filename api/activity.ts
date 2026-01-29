import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromRequest } from "../utils/getUser";
import { setCors } from "../utils/cors";

const appLinkRe = /^(https:\/\/)*strava\.app\.link\/[A-Za-z0-9]+$/;
const regex = /^https?:\/\/(www\.)?strava\.com\/activities\/(\d+)(\/.*)?$/;
const STREAM_KEYS = "distance,latlng,altitude,heartrate,time";

function isAppLinkUrl(url: string) {
  return url.match(appLinkRe) != null;
}

function getActivityIdFromUrl(url: string) {
  const match = url.match(regex);
  return match ? match[2] : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return;
  }

  let strava_url = req.headers['url'];

  if (!strava_url) {
    return res.status(400).json({ error: "Missing strava_url id header" });
  }

  strava_url = strava_url as string;

  if (isAppLinkUrl(strava_url)) {
    const response = await fetch(strava_url, {
      redirect: 'follow', method: 'HEAD', headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.url) {
      const index = response.url.indexOf('?');

      if (index !== -1)
        strava_url = response.url.substring(0, index);
      else
        strava_url = response.url;
    }
  }

  let activityId = getActivityIdFromUrl(strava_url);
  if (!activityId) return res.status(400).json({ error: 'Invalid activity URL' });

  try {
    const { accessToken } = await getUserFromRequest(req);

    const stravaRes = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const text = await stravaRes.text();

    let activity;
    try {
      activity = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "Invalid response from Strava",
        raw: text
      });
    }

    if (!stravaRes.ok) {
      return res.status(stravaRes.status).json(activity);
    }

    const streamRes = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=${STREAM_KEYS}&key_by_type=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    let streams;
    if (streamRes.ok)
      streams = await streamRes.json();

    res.status(200).json({ ...activity, streams });

  } catch (err: any) {
    console.error("Activity & streams fetch error:", err);
    res.status(401).json({ error: err.message || "Unauthorized" });
  }
}
