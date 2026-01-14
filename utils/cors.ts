import { VercelResponse } from "@vercel/node";

const FRONTEND_URL_PROD = "https://sweatstory.vercel.app";
const FRONTEND_URL_DEV = 'http://localhost:5173'

export function setCors(res: VercelResponse) {
    let isProd = process.env.NODE_ENV === "production";

    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', isProd ? FRONTEND_URL_PROD : FRONTEND_URL_DEV);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'url, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
}