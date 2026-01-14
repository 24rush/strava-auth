import type { VercelRequest, VercelResponse } from "@vercel/node";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import { getDatabase } from "../utils/mongodb";
import { UrlType, getUrlTest } from "../utils/urlswitcher";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const code = req.query.code as string;
    const site = req.query.site as string;
    const apps = JSON.parse(process.env.STRAVA_APPS!);
    const app = apps[site];

    if (!code || !app) return res.status(400).send("Missing code or invalid site");

    // Exchange code for access + refresh tokens
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: app.clientId,
            client_secret: app.clientSecret,
            code,
            grant_type: "authorization_code"
        })
    });

    const data = await tokenResponse.json();

    if (!data.access_token) return res.status(400).json(data);

    const { access_token, refresh_token, athlete, expires_at } = data;

    // Store in Mongo
    const db = await getDatabase("strava_db");
    await db.collection("logins").updateOne(
        { stravaId: athlete.id },
        {
            $set: {
                stravaId: athlete.id,
                refreshToken: refresh_token,
                accessToken: access_token,
                expiresAt: expires_at,
                profile: athlete
            }
        },
        { upsert: true }
    );

    // Issue JWT cookie
    const token = jwt.sign({ sub: athlete.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    res.setHeader(
        "Set-Cookie",
        serialize("token", token, {
            httpOnly: true,
            secure: !process.env.VERCEL_URL?.includes("localhost"),
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60
        })
    );

    let isProd = !process.env.VERCEL_URL?.includes("localhost");
    
    res.redirect(isProd ? (app['frontend'] ?? '/') : getUrlTest(UrlType.Frontend));
}
