import type { WarehouseRepository } from './ports';
import type { Warehouse } from './entities';

export class WarehouseUseCases {
  private warehouseRepo: WarehouseRepository;

  constructor(warehouseRepo: WarehouseRepository) {
    this.warehouseRepo = warehouseRepo;
  }

  async createWarehouse(branchId: string, name: string, code: string): Promise<{ ok: true; warehouse: Warehouse } | { ok: false; error: string }> {
    return this.warehouseRepo.createWarehouse(branchId, name, code);
  }

  async listByBranch(branchId: string): Promise<Warehouse[]> {
    return this.warehouseRepo.listByBranch(branchId);
  }
}
