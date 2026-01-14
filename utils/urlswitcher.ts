
const FRONTEND_URL_PROD = "https://sweatstory.vercel.app";
const FRONTEND_URL_DEV = 'http://localhost:5173'
const AUTH_URL_DEV = "http://localhost:3000";

const isProd = !process.env.VERCEL_URL?.includes("localhost");

export enum UrlType {
    Frontend,
    Auth
}

export function getUrlTest(type: UrlType) : string {
    switch (type) {
        case UrlType.Frontend:
            return FRONTEND_URL_DEV;
        case UrlType.Auth:
            return AUTH_URL_DEV;
    }    
}

export function getUrl(type: UrlType) : string {
    switch (type) {
        case UrlType.Frontend:
            return isProd ? FRONTEND_URL_PROD : FRONTEND_URL_DEV;
        case UrlType.Auth:
            return isProd ? (process.env.AUTH_URL ?? '/') : AUTH_URL_DEV;
    }
}