import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromRequest } from "../utils/getUser";

const STREAM_KEYS = "latlng,altitude";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const activityId = req.query.id as string;

  if (!activityId || !/^\d+$/.test(activityId)) {
    return res.status(400).json({ error: "Invalid or missing activity id" });
  }

  try {
    const { accessToken } = await getUserFromRequest(req);

    const stravaRes = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}/streams` +
      `?keys=${STREAM_KEYS}&key_by_type=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    // Read once
    const body = await stravaRes.text();

    // Preserve Strava status code
    res.status(stravaRes.status);

    // Preserve content type
    const contentType = stravaRes.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    // Pass-through response exactly
    return res.send(body);

  } catch (err: any) {
    console.error("Streams error:", err);
    res.status(401).json({ error: err.message || "Unauthorized" });
  }
}
