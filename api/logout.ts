import { serialize } from "cookie";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDatabase } from "../utils/mongodb";
import jwt from "jsonwebtoken";
import { setCors } from "../utils/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return;
    }

    try {
        const token = req.cookies?.token;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
            const db = await getDatabase("strava_db");
            await db.collection("logins").deleteOne({ stravaId: decoded.sub });
        }

        // Clear cookie
        const cookie = serialize("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0
        });

        res.setHeader("Set-Cookie", cookie);
        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to logout" });
    }
}
