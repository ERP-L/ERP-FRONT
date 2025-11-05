/**
 * Configuración centralizada de la aplicación
 */

// URL del backend en producción
const PRODUCTION_API_URL = 'https://leptus-erp-dpd3ayc5b2ahf0gg.canadacentral-01.azurewebsites.net';

// URL del backend en desarrollo (usa el proxy de Vite)
const DEVELOPMENT_API_URL = '/api';

/**
 * Obtiene la URL base del API según el entorno
 * - En desarrollo: usa '/api' (proxy de Vite apunta a localhost:8080)
 * - En producción: usa la URL completa del backend desplegado
 */
export const getApiBaseUrl = (): string => {
  // En desarrollo, Vite inyecta import.meta.env.DEV = true
  // En producción, import.meta.env.PROD = true
  if (import.meta.env.DEV) {
    return DEVELOPMENT_API_URL;
  }
  return PRODUCTION_API_URL;
};

// Exportar la URL base como constante para uso directo
export const API_BASE_URL = getApiBaseUrl();

