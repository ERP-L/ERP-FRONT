import type { InventoryRepository } from '../ports';
import type { InventoryItem } from '../entities';

export class InventoryRepoMemory implements InventoryRepository {
  private inventory: InventoryItem[] = [];

  async createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<{ ok: true; item: InventoryItem } | { ok: false; error: string }> {
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      ...item,
    };
    this.inventory.push(newItem);
    return { ok: true, item: newItem };
  }

  async listByLocation(branchId: string, warehouseCode: string): Promise<InventoryItem[]> {
    return this.inventory.filter(item => 
      item.branchId === branchId && item.warehouseCode === warehouseCode
    );
  }

  async updateQuantity(branchId: string, warehouseCode: string, SKU: string, quantity: number): Promise<{ ok: true; item: InventoryItem } | { ok: false; error: string }> {
    const index = this.inventory.findIndex(item => 
      item.branchId === branchId && 
      item.warehouseCode === warehouseCode && 
      item.SKU === SKU
    );
    
    if (index === -1) {
      return { ok: false, error: 'Inventory item not found' };
    }
    
    this.inventory[index].quantity = quantity;
    return { ok: true, item: this.inventory[index] };
  }

  async deleteInventoryItem(branchId: string, warehouseCode: string, SKU: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const index = this.inventory.findIndex(item => 
      item.branchId === branchId && 
      item.warehouseCode === warehouseCode && 
      item.SKU === SKU
    );
    
    if (index === -1) {
      return { ok: false, error: 'Inventory item not found' };
    }
    
    this.inventory.splice(index, 1);
    return { ok: true };
  }

  // Método adicional para la funcionalidad de la página (simplificado)
  async listByLocationSimplified(branchId: string, warehouseCode: string): Promise<{ SKU: string; quantity: number }[]> {
    return this.inventory.filter(item => 
      item.branchId === branchId && item.warehouseCode === warehouseCode
    ).map(item => ({
      SKU: item.SKU,
      quantity: item.quantity,
    }));
  }

  async saveQuantities(branchId: string, warehouseCode: string, items: { SKU: string; quantity: number }[]): Promise<void> {
    // Eliminar items existentes para esta ubicación
    this.inventory = this.inventory.filter(item => 
      !(item.branchId === branchId && item.warehouseCode === warehouseCode)
    );
    
    // Agregar los nuevos items
    items.forEach(item => {
      this.inventory.push({
        id: crypto.randomUUID(),
        branchId,
        warehouseCode,
        SKU: item.SKU,
        quantity: item.quantity,
      });
    });
  }
}
