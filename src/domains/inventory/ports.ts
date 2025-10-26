import type { InventoryItem } from './entities';

export interface InventoryRepository {
  createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<{ ok: true; item: InventoryItem } | { ok: false; error: string }>;
  listByLocation(branchId: string, warehouseCode: string): Promise<InventoryItem[]>;
  updateQuantity(branchId: string, warehouseCode: string, SKU: string, quantity: number): Promise<{ ok: true; item: InventoryItem } | { ok: false; error: string }>;
  saveQuantities(branchId: string, warehouseCode: string, items: { SKU: string; quantity: number }[]): Promise<void>;
  deleteInventoryItem(branchId: string, warehouseCode: string, SKU: string): Promise<{ ok: true } | { ok: false; error: string }>;
}
