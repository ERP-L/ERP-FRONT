
// config.ts
const PRODUCTION_API_URL   = 'https://leptus-erp-dpd3ayc5b2ahf0gg.canadacentral-01.azurewebsites.net';
const DEVELOPMENT_API_URL  = ''; // rutas relativas en dev (pasan por el proxy)

export const getApiBaseUrl = () => import.meta.env.DEV ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;
export const API_BASE_URL = getApiBaseUrl();


