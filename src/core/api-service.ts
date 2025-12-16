import type { CreateBranchRequest, CreateBranchResponse, CreateWarehouseRequest, CreateWarehouseResponse, BranchListItem, WarehouseListItem, CreateCategoryRequest, CreateCategoryResponse, CategoryHierarchyItem, ChangeParentResponse, UOMItem, CreateProductRequest, CreateProductResponse, ProductListItem, CreateLocationRequest, LocationResponse, RecentMovementResponse, CreateAreaRequest, AreaResponse, AreasListResponse, CreateCostCenterRequest, CostCenterResponse, CostCentersListResponse, CreateSupplierRequest, CreateSupplierResponse, SuppliersListResponse, SupplierProduct, PurchaseOrdersListResponse, CreatePurchaseOrderRequest, PurchaseOrderDetail, InvoiceListItem, CreateInvoiceRequest, InvoiceDetail } from './api-types';
import { AuthService } from './auth-service';
import type { WarehouseProductDetailsResponse, WarehouseProductDetailsParams, WarehouseProductStockItem, CreateMovementResponse, WarehouseProductListParams, CreateMovementRequest } from './auth-types';
import { qs } from './auth-types';
import { getApiBaseUrl } from './config';

export class ApiService {
  // Create branch endpoint
  static async createBranch(branchData: CreateBranchRequest): Promise<{ ok: true; data: CreateBranchResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/org/branches`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(branchData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear sucursal' };
      }

      const data: CreateBranchResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating branch:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Create warehouse endpoint
  static async createWarehouse(warehouseData: CreateWarehouseRequest): Promise<{ ok: true; data: CreateWarehouseResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/inventory/warehouses`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(warehouseData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear almacén' };
      }

      const data: CreateWarehouseResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating warehouse:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get all branches
  static async getBranches(): Promise<{ ok: true; data: BranchListItem[] } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/org/branches?onlyActive=true`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener sucursales' };
      }

      const data: BranchListItem[] = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting branches:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get warehouses by branch
  static async getWarehousesByBranch(branchId: number): Promise<{ ok: true; data: WarehouseListItem[] } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/inventory/warehouses?onlyActive=true&branchId=${branchId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener almacenes' };
      }

      const data: WarehouseListItem[] = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting warehouses:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Create category endpoint
  static async createCategory(categoryData: CreateCategoryRequest): Promise<{ ok: true; data: CreateCategoryResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/inventory/categories`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear categoría' };
      }

      const data: CreateCategoryResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating category:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get all categories
  static async getCategories(): Promise<{ ok: true; data: CategoryHierarchyItem[] } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/inventory/categories?onlyActive=true`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener categorías' };
      }

      const data: CategoryHierarchyItem[] = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting categories:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Change category parent
  static async changeCategoryParent(categoryId: number, newParentId: number | null): Promise<{ ok: true; data: ChangeParentResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/inventory/categories/${categoryId}/parent`, {
        method: 'PATCH',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ newParentCategoryId: newParentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al cambiar padre de categoría' };
      }

      const data: ChangeParentResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error changing category parent:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get UOMs (Units of Measure)
  static async getUOMs(): Promise<{ ok: true; data: UOMItem[] } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/inventory/uoms`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener unidades de medida' };
      }

      const data: UOMItem[] = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting UOMs:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Create product
  static async createProduct(productData: CreateProductRequest): Promise<{ ok: true; data: CreateProductResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/inventory/products`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear producto' };
      }

      const data: CreateProductResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating product:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get products
  static async getProducts(): Promise<{ ok: true; data: ProductListItem[] } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/inventory/products`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener productos' };
      }

      const data: ProductListItem[] = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting products:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Create location (estantería)
  static async createLocation(warehouseId: number, locationData: CreateLocationRequest): Promise<{ ok: true; data: LocationResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/inventory/warehouses/${warehouseId}/locations`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear estantería' };
      }

      const data: LocationResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating location:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get locations (estanterías) by warehouse
  static async getLocationsByWarehouse(warehouseId: number, onlyAllowStock: boolean = true): Promise<{ ok: true; data: LocationResponse[] } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/inventory/warehouses/${warehouseId}/locations?onlyAllowStock=${onlyAllowStock}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener estanterías' };
      }

      const data: LocationResponse[] = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting locations:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }



    // POST /api/inventory/movements
    static async createInventoryMovement(
      movement: CreateMovementRequest
    ): Promise<{ ok: true; data: CreateMovementResponse } | { ok: false; error: string }> {
      try {
        console.log('createInventoryMovement', movement);
        const authHeader = AuthService.getAuthHeader();
        const response = await fetch(`${getApiBaseUrl()}/api/inventory/movements`, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify(movement),
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return { ok: false, error: errorData.message || 'Error al registrar movimiento' };
        }
  
        const data: CreateMovementResponse = await response.json();
        return { ok: true, data };
      } catch (e) {
        console.error('Error createInventoryMovement:', e);
        return { ok: false, error: 'Error de conexión' };
      }
    }
  
    // GET /api/inventory/warehouses/{warehouseId}/products
    static async getWarehouseProducts(
      warehouseId: number,
      params: WarehouseProductListParams = {}
    ): Promise<{ ok: true; data: WarehouseProductStockItem[] } | { ok: false; error: string }> {
      try {
        console.log('getWarehouseProducts', warehouseId, params);
        const authHeader = AuthService.getAuthHeader();
        const url = `${getApiBaseUrl()}/api/inventory/warehouses/${warehouseId}/products` + qs(params);
  
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': '*/*',
            ...authHeader,
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return { ok: false, error: errorData.message || 'Error al obtener productos del almacén' };
        }
  
        const data: WarehouseProductStockItem[] = await response.json();
        return { ok: true, data };
      } catch (e) {
        console.error('Error getWarehouseProducts:', e);
        return { ok: false, error: 'Error de conexión' };
      }
    }
  
    // GET /api/inventory/warehouses/{warehouseId}/products/{productId}/details
    static async getWarehouseProductDetails(
      warehouseId: number,
      productId: number,
      params: WarehouseProductDetailsParams = {
        orderBatch: 'ExpirationDate',
        pageBatch: 1,
        sizeBatch: 100,
        orderSerial: 'SerialNumber',
        pageSerial: 1,
        sizeSerial: 100,
      }
    ): Promise<{ ok: true; data: WarehouseProductDetailsResponse } | { ok: false; error: string }> {
      try {
        console.log('getWarehouseProductDetails', warehouseId, productId, params);
        const authHeader = AuthService.getAuthHeader();
        const url = `${getApiBaseUrl()}/api/inventory/warehouses/${warehouseId}/products/${productId}/details` + qs(params);
  
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': '*/*',
            ...authHeader,
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return { ok: false, error: errorData.message || 'Error al obtener detalles del producto' };
        }
  
        const data: WarehouseProductDetailsResponse = await response.json();
        return { ok: true, data };
      } catch (e) {
        console.error('Error getWarehouseProductDetails:', e);
        return { ok: false, error: 'Error de conexión' };
      }
    }

    // Get recent movements
    static async getRecentMovements(
      warehouseId: number,
      page: number = 1,
      size: number = 20
    ): Promise<{ ok: true; data: RecentMovementResponse[] } | { ok: false; error: string }> {
      try {
        const authHeader = AuthService.getAuthHeader();
        const url = `${getApiBaseUrl()}/api/inventory/movements/recent?warehouseId=${warehouseId}&page=${page}&size=${size}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': '*/*',
            ...authHeader,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return { ok: false, error: errorData.message || 'Error al obtener movimientos recientes' };
        }

        const data: RecentMovementResponse[] = await response.json();
        return { ok: true, data };
      } catch (e) {
        console.error('Error getRecentMovements:', e);
        return { ok: false, error: 'Error de conexión' };
      }
    }

  // Create area
  static async createArea(areaData: CreateAreaRequest): Promise<{ ok: true; data: AreaResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/areas`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(areaData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear área' };
      }

      const data: AreaResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating area:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get areas by branch
  static async getAreasByBranch(branchId: number, page: number = 1, pageSize: number = 20): Promise<{ ok: true; data: AreasListResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/branches/${branchId}/areas?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener áreas' };
      }

      const data: AreasListResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting areas:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get area by id
  static async getAreaById(areaId: number): Promise<{ ok: true; data: AreaResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/areas/${areaId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener área' };
      }

      const data: AreaResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting area:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Create cost center
  static async createCostCenter(costCenterData: CreateCostCenterRequest): Promise<{ ok: true; data: CostCenterResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/costcenters/costcenters`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(costCenterData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear centro de costos' };
      }

      const data: CostCenterResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating cost center:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get cost centers by area
  static async getCostCentersByArea(areaId: number, page: number = 0, pageSize: number = 25): Promise<{ ok: true; data: CostCentersListResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/costcenters?areaId=${areaId}&page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener centros de costos' };
      }

      const data: CostCentersListResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting cost centers:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get cost centers by branch
  static async getCostCentersByBranch(branchId: number, page: number = 0, pageSize: number = 25): Promise<{ ok: true; data: CostCentersListResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/costcenters?branchId=${branchId}&page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener centros de costos' };
      }

      const data: CostCentersListResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting cost centers by branch:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get cost center by id
  static async getCostCenterById(costCenterId: number): Promise<{ ok: true; data: CostCenterResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/costcenters/${costCenterId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener centro de costos' };
      }

      const data: CostCenterResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting cost center:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Create supplier
  static async createSupplier(supplierData: CreateSupplierRequest): Promise<{ ok: true; data: CreateSupplierResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/inventoryR/suppliers`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear proveedor' };
      }

      const data: CreateSupplierResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get suppliers
  static async getSuppliers(active: boolean = true, page: number = 1, pageSize: number = 20): Promise<{ ok: true; data: SuppliersListResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/inventoryR/suppliers?active=${active}&page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener proveedores' };
      }

      const data: SuppliersListResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get supplier products
  static async getSupplierProducts(supplierId: number): Promise<{ ok: true; data: SupplierProduct[] } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/inventoryR/suppliers/${supplierId}/products`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener productos del proveedor' };
      }

      const data: SupplierProduct[] = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting supplier products:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Assign products to supplier
  static async assignProductsToSupplier(supplierId: number, productIds: number[]): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/inventoryR/suppliers/${supplierId}/products`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(productIds),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al asignar productos al proveedor' };
      }

      // La API puede devolver un array vacío o no devolver nada
      await response.json().catch(() => ({}));
      return { ok: true };
    } catch (error) {
      console.error('Error assigning products to supplier:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get purchase orders
  static async getPurchaseOrders(costCenterId: number, pageNumber: number = 1, pageSize: number = 20): Promise<{ ok: true; data: PurchaseOrdersListResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/purchase-orders?costCenterId=${costCenterId}&pageNumber=${pageNumber}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener órdenes de compra' };
      }

      const data: PurchaseOrdersListResponse = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Create purchase order
  static async createPurchaseOrder(orderData: CreatePurchaseOrderRequest): Promise<{ ok: true; data: PurchaseOrderDetail } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/purchase-orders`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear orden de compra' };
      }

      const data: PurchaseOrderDetail = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating purchase order:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get purchase order details
  static async getPurchaseOrderDetails(purchaseOrderId: number): Promise<{ ok: true; data: PurchaseOrderDetail } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/purchase-orders/${purchaseOrderId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener detalles de la orden de compra' };
      }

      const data: PurchaseOrderDetail = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting purchase order details:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get invoices
  static async getInvoices(costCenterId: number, pageNumber: number = 1, pageSize: number = 20): Promise<{ ok: true; data: InvoiceListItem[] } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/invoices?costCenterId=${costCenterId}&pageNumber=${pageNumber}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener facturas' };
      }

      const data: InvoiceListItem[] = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting invoices:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Create invoice
  static async createInvoice(invoiceData: CreateInvoiceRequest): Promise<{ ok: true; data: InvoiceDetail } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/invoices`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al crear factura' };
      }

      const data: InvoiceDetail = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }

  // Get invoice details
  static async getInvoiceDetails(invoiceId: number): Promise<{ ok: true; data: InvoiceDetail } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${getApiBaseUrl()}/api/finances/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { ok: false, error: errorData.message || 'Error al obtener detalles de la factura' };
      }

      const data: InvoiceDetail = await response.json();
      return { ok: true, data };
    } catch (error) {
      console.error('Error getting invoice details:', error);
      return { ok: false, error: 'Error de conexión' };
    }
  }
  
}
