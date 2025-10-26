import type { ProductRepository } from '../ports';
import type { Product } from '../entities';

export class ProductRepoMemory implements ProductRepository {
  private products: Product[] = [];
  
  // Datos hardcodeados para categorías y unidades de medida
  private categories: string[] = [
    "Electrónicos",
    "Ropa y Accesorios", 
    "Hogar y Jardín",
    "Deportes y Recreación",
    "Libros y Medios",
    "Salud y Belleza",
    "Automotriz",
    "Alimentación",
    "Juguetes y Juegos",
    "Oficina y Escolar"
  ];
  
  private units: string[] = [
    "Unidad",
    "Kilogramo",
    "Gramo", 
    "Litro",
    "Metro",
    "Centímetro",
    "Metro cuadrado",
    "Metro cúbico",
    "Docena",
    "Caja",
    "Paquete",
    "Botella",
    "Bolsa",
    "Pieza"
  ];

  async createProduct(product: Omit<Product, 'id'>): Promise<{ ok: true; product: Product } | { ok: false; error: string }> {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      ...product,
    };
    this.products.push(newProduct);
    return { ok: true, product: newProduct };
  }

  async listProducts(): Promise<Product[]> {
    return this.products;
  }

  async list(): Promise<Product[]> {
    return this.products;
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.products.find(p => p.id === id) || null;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<{ ok: true; product: Product } | { ok: false; error: string }> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return { ok: false, error: 'Product not found' };
    }
    this.products[index] = { ...this.products[index], ...product };
    return { ok: true, product: this.products[index] };
  }

  async deleteProduct(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return { ok: false, error: 'Product not found' };
    }
    this.products.splice(index, 1);
    return { ok: true };
  }

  // Métodos para obtener categorías y unidades
  getCategories(): string[] {
    return [...this.categories];
  }
  
  getUnits(): string[] {
    return [...this.units];
  }
  
  addCategory(category: string): void {
    if (!this.categories.includes(category)) {
      this.categories.push(category);
    }
  }
  
  addUnit(unit: string): void {
    if (!this.units.includes(unit)) {
      this.units.push(unit);
    }
  }

  // Método adicional para la funcionalidad de la página
  async create?(payload: {
    SKU?: string;
    ProductName: string;
    CategoryName?: string;
    UnitName?: string;
    IsSerialized: boolean;
    IsBatchControlled: boolean;
    ReorderLevel?: number;
    LeadTimeDays?: number;
    Weight?: number;
    Volume?: number;
  }): Promise<void> {
    // Agregar nueva categoría si no existe
    if (payload.CategoryName && !this.categories.includes(payload.CategoryName)) {
      this.addCategory(payload.CategoryName);
    }
    
    // Agregar nueva unidad si no existe
    if (payload.UnitName && !this.units.includes(payload.UnitName)) {
      this.addUnit(payload.UnitName);
    }
    
    const product: Product = {
      id: crypto.randomUUID(),
      SKU: payload.SKU || undefined,
      ProductName: payload.ProductName,
      CategoryID: payload.CategoryName || undefined,
      UOMID: payload.UnitName || undefined,
      IsSerialized: payload.IsSerialized,
      IsBatchControlled: payload.IsBatchControlled,
      ReorderLevel: payload.ReorderLevel || undefined,
      LeadTimeDays: payload.LeadTimeDays || undefined,
      Weight: payload.Weight || undefined,
      Volume: payload.Volume || undefined,
    };
    this.products.push(product);
  }
}
