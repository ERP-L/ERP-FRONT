import type { LoginRequest, LoginResponse, SignupRequest, SignupResponse, AuthSession } from './auth-types';
import { getApiBaseUrl } from './config';

export class AuthService {
  private static readonly SESSION_KEY = 'erp_auth_session';

  // Login endpoint
  static async login(credentials: LoginRequest): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/sign-in`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      console.log(response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error de autenticación' };
      }

      const data: LoginResponse = await response.json();
      
      const session: AuthSession = {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
        securityUserId: data.securityUserId,
        authUserId: data.authUserId,
        companyId: data.companyId,
        globalRoles: data.globalRoles,
        companyRoles: data.companyRoles,
        expiresAt: Date.now() + (data.expiresIn * 1000), // Convert seconds to milliseconds
      };

      // Save to localStorage
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      return { ok: true, session };
    } catch (error) {
      console.error(error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Signup endpoint
  static async signup(signupData: SignupRequest): Promise<{ ok: true; data: SignupResponse } | { ok: false; error: string }> {
    console.log(signupData);
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/sign-up`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });
      console.log(response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error en el registro' };
      }

      const data: SignupResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error(error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get current session from localStorage
  static getCurrentSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: AuthSession = JSON.parse(sessionData);
      
      // Check if token is expired
      if (Date.now() >= session.expiresAt) {
        this.logout();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  // Logout and clear session
  static logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Get authorization header for API calls
  static getAuthHeader(): { Authorization: string } | object {
    const session = this.getCurrentSession();
    if (!session) return {};
    
    return { Authorization: `Bearer ${session.accessToken}` };
  }
}
