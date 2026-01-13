import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../utils/mongodb";
import { verifyJWT, refreshStravaToken } from "../utils/auth";
import { parse as parseCookie } from "cookie";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookies = parseCookie(req.headers.cookie || "");
  const jwtToken = cookies.session;
  if (!jwtToken) {
    res.status(401).send("Not logged in");
    return;
  }

  const payload: any = verifyJWT(jwtToken);
  if (!payload) {
    res.status(401).send("Invalid session");
    return;
  }

  const db = await getDb();
  const tokens = db.collection("tokens");

  const accessToken = await refreshStravaToken(payload.site, payload.athleteId, tokens);

  res.status(200).json({
    athleteId: payload.athleteId,
    site: payload.site,
    accessToken,
  });
}
