import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromRequest } from "../../utils/getUser";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const activityId = req.query.id as string;
    if (!activityId) return res.status(400).json({ error: "Missing activity ID" });

    try {
        const { user, accessToken } = await getUserFromRequest(req);

        const activityRes = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!activityRes.ok) {
            const errorData = await activityRes.json();
            return res.status(activityRes.status).json(errorData);
        }

        const activityData = await activityRes.json();
        res.status(200).json(activityData);
    } catch (err: any) {
        console.error(err);
        res.status(401).json({ error: err.message });
    }
}
