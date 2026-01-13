import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromRequest } from "../utils/getUser";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const { user } = await getUserFromRequest(req);
        res.status(200).json({ user: user.profile });
    } catch (err: any) {
        res.status(401).json({ error: err.message });
    }
}
