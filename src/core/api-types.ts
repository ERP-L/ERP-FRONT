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

export interface LocationResponse {
  locationId: number;
  warehouseId: number;
  parentId: number | null;
  parentCode: string | null;
  code: string;
  allowStock: boolean;
  createdUtc: string;
}

// Recent movements API types
export interface RecentMovementResponse {
  tipo: string;
  producto: string;
  cantidad: number;
  fecha: string;
  usuario: string;
  referencia: string;
}

// Area API types
export interface CreateAreaRequest {
  branchId: number;
  name: string;
  code: string;
  description: string;
  userInChargeId: number;
}

export interface AreaResponse {
  areaId: number;
  companyId: number;
  branchId: number;
  name: string;
  code: string;
  description: string;
  userInChargeId: number;
  createdUtc: string;
  updatedUtc: string | null;
}

export interface AreasListResponse {
  totalCount: number;
  items: AreaResponse[];
}

// Cost Center API types
export interface CreateCostCenterRequest {
  areaId: number;
  code: string;
  name: string;
  description: string;
}

export interface CostCenterResponse {
  costCenterId: number;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  dateCreated: string;
  userCreated: number;
  dateModified: string | null;
  userModified: number | null;
  areaId: number;
  companyId: number;
}

export interface CostCentersListResponse {
  totalCount: number;
  items: CostCenterResponse[];
}

// Supplier API types
export interface CreateSupplierRequest {
  supplierName: string;
  taxNumber: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface CreateSupplierResponse {
  supplierId: number;
  supplierName: string;
  taxNumber: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
}

export interface SupplierListItem {
  supplierId: number;
  supplierName: string;
  taxNumber: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
}

export interface SuppliersListResponse {
  totalCount: number;
  items: SupplierListItem[];
}

export interface SupplierProduct {
  productId: number;
  sku: string;
  productName: string;
}

// Purchase Order API types
export interface PurchaseOrderListItem {
  purchaseOrderId: number;
  codigo: string;
  companyId: number;
  costCenterId: number;
  costCenterName: string;
  costCenterCode: string;
  ruc: string;
  nombre: string;
  direccion: string;
  telefono: string;
  fechaEmision: string;
  total: number;
  purchaseType: string;
  status: string;
  dateCreated: string;
  userCreated: number;
  totalRows: number;
}

export interface PurchaseOrdersListResponse {
  items: PurchaseOrderListItem[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CreatePurchaseOrderRequest {
  costCenterId: number;
  purchaseTypeId: number;
  codigo: string;
  ruc: string;
  nombre: string;
  direccion: string;
  telefono: string;
  fechaEmision: string;
  products: PurchaseOrderProduct[];
}

export interface PurchaseOrderProduct {
  productId: number;
  warehouseId: number;
  cantidad: number;
  unitCost: number;
}

export interface PurchaseOrderDetail {
  purchaseOrderId: number;
  codigo: string;
  companyId: number;
  costCenterId: number;
  costCenterName: string;
  ruc: string;
  nombre: string;
  direccion: string;
  telefono: string;
  fechaEmision: string;
  total: number;
  purchaseType: string;
  status: string;
  products: PurchaseOrderProduct[];
}

// Invoice API types
export interface InvoiceListItem {
  invoiceId: number;
  companyId: number;
  branchId: number;
  documentTypeId: number;
  documentTypeName: string;
  ruc: string;
  serie: string;
  numeroFactura: string;
  code: string;
  igv: number;
  total: number;
  fecha: string;
  urlDocumento: string;
  purchaseOrderId: number | null;
  costCenterId: number;
  costCenterName: string;
  dateCreated: string;
  userCreated: number;
  dateModified: string | null;
  userModified: number | null;
  totalRows: number;
}

export interface InvoiceItem {
  invoiceItemId?: number;
  productId: number;
  cantidad: number;
  unitCost: number;
}

export interface CreateInvoiceRequest {
  documentTypeId: number;
  ruc: string;
  serie: string;
  numeroFactura: string;
  igv: number;
  total: number;
  fecha: string;
  urlDocumento: string;
  costCenterId: number;
  branchId: number;
  code: string;
  items: InvoiceItem[];
  purchaseOrderId?: number;
}

export interface InvoiceDetail {
  invoiceId: number;
  companyId: number;
  documentTypeId: number;
  documentTypeName: string;
  ruc: string;
  serie: string;
  numeroFactura: string;
  igv: number;
  total: number;
  fecha: string;
  urlDocumento: string;
  purchaseOrderId: number | null;
  costCenterId: number;
  costCenterName: string;
  branchId: number;
  code: string;
  dateCreated: string;
  userCreated: number;
  items: InvoiceItem[];
}