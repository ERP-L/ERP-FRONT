import type { WarehouseRepository } from '../ports';
import type { Warehouse, WarehouseExtended } from '../entities';

export class WarehouseRepoMemory implements WarehouseRepository {
  private warehouses: Warehouse[] = [];

  async createWarehouse(branchId: string, name: string, code: string): Promise<{ ok: true; warehouse: Warehouse } | { ok: false; error: string }> {
    const warehouse: Warehouse = {
      id: crypto.randomUUID(),
      branchId,
      name,
      code,
    };
    this.warehouses.push(warehouse);
    return { ok: true, warehouse };
  }

  /*async listByBranch(branchId: string): Promise<Warehouse[]> {
    return this.warehouses.filter(w => w.branchId === branchId);
  }*/

  // Métodos adicionales para la nueva funcionalidad
  async listByBranch(branchId: string): Promise<Warehouse[]> {
    return this.warehouses.filter(w => w.branchId === branchId);
  }

  async listByBranchExtended(branchId: string): Promise<WarehouseExtended[]> {
       return this.warehouses
         .filter(w => w.branchId === branchId)
         .map<WarehouseExtended>(w => ({
         branchId: w.branchId,
         code: w.code,
         name: w.name,
         address: '',
         phone: '',
         email: '',
         }));
    }
  async create(payload: { branchId: string; code: string; name: string; address: string; phone: string; email: string }): Promise<void> {
    const warehouse: Warehouse = {
      id: crypto.randomUUID(),
      branchId: payload.branchId,
      name: payload.name,
      code: payload.code,
    };
    this.warehouses.push(warehouse);
  }

  async update(payload: { branchId: string; code: string; name: string; address: string; phone: string; email: string }, originalCode?: string): Promise<void> {
    const index = this.warehouses.findIndex(w => w.branchId === payload.branchId && w.code === originalCode);
    if (index !== -1) {
      this.warehouses[index] = {
        ...this.warehouses[index],
        name: payload.name,
        code: payload.code,
      };
    }
  }

  async delete(branchId: string, code: string): Promise<void> {
    this.warehouses = this.warehouses.filter(w => !(w.branchId === branchId && w.code === code));
  }
}