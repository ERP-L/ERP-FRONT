import type { ProductRepository } from './ports';
import type { Product } from './entities';

export interface ProductUseCases {
  createProduct(product: Omit<Product, 'id'>): Promise<{ ok: true; product: Product } | { ok: false; error: string }>;
  listProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  updateProduct(id: string, product: Partial<Product>): Promise<{ ok: true; product: Product } | { ok: false; error: string }>;
  deleteProduct(id: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

export class ProductUseCasesImpl implements ProductUseCases {
  private readonly productRepo: ProductRepository; // ← campo normal

  constructor(productRepo: ProductRepository) {    // ← sin "private" aquí
    this.productRepo = productRepo;                // ← asignación explícita
  }

  async createProduct(product: Omit<Product, 'id'>) {
    return this.productRepo.createProduct(product);
  }
  async listProducts() {
    return this.productRepo.listProducts();
  }
  async getProductById(id: string) {
    return this.productRepo.getProductById(id);
  }
  async updateProduct(id: string, product: Partial<Product>) {
    return this.productRepo.updateProduct(id, product);
  }
  async deleteProduct(id: string) {
    return this.productRepo.deleteProduct(id);
  }
}
