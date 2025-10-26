// Types for authentication API responses

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  securityUserId: number;
  authUserId: number;
  companyId: number;
  globalRoles: number[];
  companyRoles: number[];
}

export interface SignupRequest {
  company: {
    legalName: string;
    documentTypeId: number;
    documentNumber: string;
    tradeName: string;
    address: string;
    ubigeoId: number;
    phone: string;
    email: string;
  };
  securityUser: {
    email: string;
    username: string;
    password: string;
  };
  tenantUser: {
    firstName: string;
    lastName: string;
    gender: string;
    phone: string;
    documentTypeId: number;
    documentNumber: string;
  };
}

export interface SignupResponse {
  companyId: number;
  securityUserId: number;
  authUserId: number;
}

export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  securityUserId: number;
  authUserId: number;
  companyId: number;
  globalRoles: number[];
  companyRoles: number[];
  expiresAt: number; // timestamp when token expires
}
