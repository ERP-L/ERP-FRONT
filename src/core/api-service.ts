import type { CreateBranchRequest, CreateBranchResponse, CreateWarehouseRequest, CreateWarehouseResponse, BranchListItem, WarehouseListItem, CreateCategoryRequest, CreateCategoryResponse, CategoryHierarchyItem, ChangeParentResponse, UOMItem, CreateProductRequest, CreateProductResponse, ProductListItem } from './api-types';
import { AuthService } from './auth-service';

const API_BASE_URL = '/api';

export class ApiService {
  // Create branch endpoint
  static async createBranch(branchData: CreateBranchRequest): Promise<{ ok: true; data: CreateBranchResponse } | { ok: false; error: string }> {
    try {
      const authHeader = AuthService.getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/org/branches`, {
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
      const response = await fetch(`${API_BASE_URL}/inventory/warehouses`, {
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
      const response = await fetch(`${API_BASE_URL}/org/branches?onlyActive=true`, {
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
      const response = await fetch(`${API_BASE_URL}/inventory/warehouses?onlyActive=true&branchId=${branchId}`, {
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
      const response = await fetch(`${API_BASE_URL}/inventory/categories`, {
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
      const response = await fetch(`${API_BASE_URL}/inventory/categories?onlyActive=true`, {
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
      const response = await fetch(`${API_BASE_URL}/inventory/categories/${categoryId}/parent`, {
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
      const response = await fetch(`${API_BASE_URL}/inventory/uoms`, {
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
      const response = await fetch(`${API_BASE_URL}/inventory/products`, {
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
      const response = await fetch(`${API_BASE_URL}/inventory/products`, {
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
}
