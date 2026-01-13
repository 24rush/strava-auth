import { getDatabase } from "../utils/mongodb";

export default async function handler(req, res) {
  const db = await getDatabase("strava_db");
  const users = await db.collection("logins").find().toArray();
  res.json(users);
}
