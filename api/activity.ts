import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromRequest } from "../utils/getUser";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const activityId = req.query.id as string;

  if (!activityId) {
    return res.status(400).json({ error: "Missing activity id query param" });
  }

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

    // Strava sometimes returns non-JSON errors
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "Invalid response from Strava",
        raw: text
      });
    }

    if (!stravaRes.ok) {
      return res.status(stravaRes.status).json(data);
    }

    res.status(200).json(data);
  } catch (err: any) {
    console.error("Activity fetch error:", err);
    res.status(401).json({ error: err.message || "Unauthorized" });
  }
}
