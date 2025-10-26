import type { Product } from './entities';

export interface ProductRepository {
  createProduct(product: Omit<Product, 'id'>): Promise<{ ok: true; product: Product } | { ok: false; error: string }>;
  listProducts(): Promise<Product[]>;
  list(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  updateProduct(id: string, product: Partial<Product>): Promise<{ ok: true; product: Product } | { ok: false; error: string }>;
  deleteProduct(id: string): Promise<{ ok: true } | { ok: false; error: string }>;

  getCategories(): string[];
  getUnits(): string[];
}
