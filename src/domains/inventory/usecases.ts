import type { InventoryRepository } from './ports';
import type { InventoryItem } from './entities';

export interface InventoryUseCases {
  createInventoryItem(item: { branchId: string; warehouseCode: string; SKU: string; quantity: number }): Promise<{ ok: true; item: InventoryItem } | { ok: false; error: string }>;
  listByLocation(branchId: string, warehouseCode: string): Promise<InventoryItem[]>;
  updateQuantity(branchId: string, warehouseCode: string, SKU: string, quantity: number): Promise<{ ok: true; item: InventoryItem } | { ok: false; error: string }>;
  saveQuantities(branchId: string, warehouseCode: string, items: { SKU: string; quantity: number }[]): Promise<void>;
  deleteInventoryItem(branchId: string, warehouseCode: string, SKU: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

export class InventoryUseCasesImpl implements InventoryUseCases {
  private readonly inventoryRepo: InventoryRepository; // ← declarar el campo

  constructor(inventoryRepo: InventoryRepository) {   // ← sin "private" aquí
    this.inventoryRepo = inventoryRepo;               // ← asignar explícitamente
  }

  async createInventoryItem(item: { branchId: string; warehouseCode: string; SKU: string; quantity: number }) {
    return this.inventoryRepo.createInventoryItem(item);
  }

  async listByLocation(branchId: string, warehouseCode: string) {
    return this.inventoryRepo.listByLocation(branchId, warehouseCode);
  }

  async updateQuantity(branchId: string, warehouseCode: string, SKU: string, quantity: number) {
    return this.inventoryRepo.updateQuantity(branchId, warehouseCode, SKU, quantity);
  }

  async saveQuantities(branchId: string, warehouseCode: string, items: { SKU: string; quantity: number }[]) {
    return this.inventoryRepo.saveQuantities(branchId, warehouseCode, items);
  }

  async deleteInventoryItem(branchId: string, warehouseCode: string, SKU: string) {
    return this.inventoryRepo.deleteInventoryItem(branchId, warehouseCode, SKU);
  }
}
