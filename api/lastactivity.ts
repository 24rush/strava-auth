import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromRequest } from "../utils/getUser";
import { setCors } from "../utils/cors";

const STREAM_KEYS = "distance,latlng,altitude,heartrate,time,watts";

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return;
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { accessToken } = await getUserFromRequest(req);

        let stravaRes = await fetch(
            `https://www.strava.com/api/v3/athlete/activities?per_page=1`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        let text = await stravaRes.text();

        let lastActivity;
        try {
            lastActivity = JSON.parse(text);
            if (lastActivity && lastActivity.length > 0)
                lastActivity = lastActivity[0];
            else
                throw "Invalid response from Strava";
        } catch {
            return res.status(500).json({
                error: "Invalid response from Strava",
                raw: text
            });
        }

        if (!stravaRes.ok) {
            return res.status(stravaRes.status).json(lastActivity);
        }

        stravaRes = await fetch(
            `https://www.strava.com/api/v3/activities/${lastActivity.id}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        text = await stravaRes.text();
        
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
            `https://www.strava.com/api/v3/activities/${activity.id}/streams?keys=${STREAM_KEYS}&key_by_type=true`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        let streams;
        if (streamRes.ok)
            streams = await streamRes.json();

        res.status(200).json({ ...activity, streams });

    } catch (err: any) {
        console.error("Get lastactivity error:", err);
        res.status(401).json({ error: err.message || "Unauthorized" });
    }
}
