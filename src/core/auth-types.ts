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


// --- helper para querystrings ---
export const qs = (params: Record<string, unknown> = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .reduce((u, [k, v], i) => u + (i ? '&' : '?') + encodeURIComponent(k) + '=' + encodeURIComponent(String(v)), '');

// --- tipos mínimos para compilar ---
export type MovementLineRequest = {
  productId?: number;
  batchId?: number;
  batchNumber?: string;
  batchManufactureDate?: string; // 'YYYY-MM-DD'
  batchExpirationDate?: string;  // 'YYYY-MM-DD'
  serialId?: number;
  serialNumber?: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
  locationCode?: string;
};

export type CreateMovementRequest = {
  movementType: string;
  lineMode: string;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  referenceNumber?: string;
  movementDate: string; // ISO
  lines: MovementLineRequest[];
  autoCreateBatch?: boolean;
  autoCreateSerial?: boolean;
  autoCreateLocation?: boolean;
};

export type CreateMovementResponse = {
  movementId: number;
  movementDate: string;      // ISO
  referenceNumber: string;
};

export type WarehouseProductListParams = {
  productId?: number;
  categoryId?: number;
  search?: string;
  orderBy?: string;     // ej. 'ProductName'
  pageNumber?: number;  // ej. 1
  pageSize?: number;    // ej. 50
};

export type WarehouseProductStockItem = {
  productId: number;
  sku: string;
  productName: string;
  categoryId: number;
  uomId: number;
  isSerialized: boolean;
  isBatchControlled: boolean;
  status: number;
  createdUtc: string;
  companyId: number;
  trackingMode: string;
  trackingLabel: string;
  avgCost: number;
  quantity: number;
  reserved: number;
  locationsStr: string;
  updatedUtc: string;
};

export type WarehouseProductDetailsParams = {
  orderBatch?: string;  // default: 'ExpirationDate'
  pageBatch?: number;   // default: 1
  sizeBatch?: number;   // default: 100
  orderSerial?: string; // default: 'SerialNumber'
  pageSerial?: number;  // default: 1
  sizeSerial?: number;  // default: 100
};

export type WarehouseProductDetailsResponse = {
  batches: Array<{
    batchId: number;
    batchNumber: string;
    manufactureDate: string; // 'YYYY-MM-DD'
    expirationDate: string;  // 'YYYY-MM-DD'
    createdUtc: string;
    quantity: number;
    reserved: number;
    lastLocation: string;
    updatedUtc: string;
  }>;
  serials: Array<{
    serialId: number;
    serialNumber: string;
    unitCost: number;
    createdUtc: string;
    lastLocation: string;
    updatedUtc: string;
  }>;
};
