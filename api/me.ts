import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromRequest } from "../utils/getUser";
import { setCors } from "../utils/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return;
    }

    try {
        const { user, expiresAt } = await getUserFromRequest(req);
        res.status(200).json({ user: user.profile, expiresAt: expiresAt });
    } catch (err: any) {
        res.status(401).json({ error: err.message });
    }
}
