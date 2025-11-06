// Types for API endpoints

// Branch API types
export interface CreateBranchRequest {
  name: string;
  address: string;
  ubigeoId: string;
}

export interface CreateBranchResponse {
  branchId: number;
  companyId: number;
  name: string;
  address: string;
  ubigeoId: string;
  isActive: boolean;
  createdUtc: string;
}

// Warehouse API types
export interface CreateWarehouseRequest {
  branchId: number;
  warehouseCode: string;
  warehouseName: string;
  address: string;
  phone: string;
  contact: string;
}

export interface CreateWarehouseResponse {
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  address: string;
  phone: string;
  contact: string;
  isActive: boolean;
  createdUtc: string;
  branchId: number;
}

// Branch list types
export interface BranchListItem {
  branchId: number;
  companyId: number;
  name: string;
  address: string;
  ubigeoId: string;
  isActive: boolean;
  createdUtc: string;
}

// Warehouse list types
export interface WarehouseListItem {
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  address: string;
  phone: string;
  contact: string;
  isActive: boolean;
  createdUtc: string;
  branchId: number;
}

// Category API types
export interface CreateCategoryRequest {
  categoryName: string;
  description: string;
  parentCategoryId: number | null;
  isActive: boolean;
}

export interface CreateCategoryResponse {
  categoryId: number;
  categoryName: string;
  description: string;
  parentCategoryId: number | null;
  isActive: boolean;
  createdUtc: string;
}

// Category list types
export interface CategoryListItem {
  categoryId: number;
  categoryName: string;
  description: string;
  parentCategoryId: number | null;
  parentCategoryName?: string;
  isActive: boolean;
  createdUtc: string;
  companyId: number;
  children?: CategoryListItem[];
}

// Category hierarchy types
export interface CategoryHierarchyItem extends CategoryListItem {
  children: CategoryHierarchyItem[];
}

// Change parent request
export interface ChangeParentRequest {
  newParentCategoryId: number | null;
}

// Change parent response
export interface ChangeParentResponse {
  categoryId: number;
  categoryName: string;
  parentCategoryId: number | null;
  isActive: boolean;
  createdUtc: string;
  companyId: number;
}

// UOM (Unit of Measure) types
export interface UOMItem {
  uomId: number;
  uomCode: string;
  uomName: string;
  decimalPlaces: number;
  createdUtc: string;
}

// Product API types
export interface CreateProductRequest {
  sku: string;
  productName: string;
  categoryId: number;
  uomId: number;
  isSerialized: boolean;
  isBatchControlled: boolean;
  reorderLevel: number;
  leadTimeDays: number;
  weight: number;
  volume: number;
}

export interface CreateProductResponse {
  productId: number;
  sku: string;
  productName: string;
  categoryId: number;
  uomId: number;
  isSerialized: boolean;
  isBatchControlled: boolean;
  reorderLevel: number;
  leadTimeDays: number;
  weight: number;
  volume: number;
  status: number;
  createdUtc: string;
  updatedUtc: string;
  companyId: number;
}

// Product list types
export interface ProductListItem {
  productId: number;
  sku: string;
  productName: string;
  categoryId: number;
  uomId: number;
  isSerialized: boolean;
  isBatchControlled: boolean;
  reorderLevel: number;
  leadTimeDays: number;
  weight: number;
  volume: number;
  status: number;
  createdUtc: string;
  updatedUtc: string;
  companyId: number;
  categoryName?: string;
  uomName?: string;
}

// Location (Estantería) API types
export interface CreateLocationRequest {
  code: string;
  allowStock: boolean;
}

export interface CreateLocationResponse {
  locationId: number;
  warehouseId: number;
  parentId: number | null;
  parentCode: string | null;
  code: string;
  allowStock: boolean;
  createdUtc: string;
}

// Location list types
export interface LocationListItem {
  locationId: number;
  warehouseId: number;
  parentId: number | null;
  parentCode: string | null;
  code: string;
  allowStock: boolean;
  createdUtc: string;
}