import type { Warehouse } from './entities';

export interface WarehouseRepository {
  createWarehouse(branchId: string, name: string, code: string): Promise<{ ok: true; warehouse: Warehouse } | { ok: false; error: string }>;
  listByBranch(branchId: string): Promise<Warehouse[]>;
  listByBranchExtended(branchId: string): Promise<{ branchId: string; code: string; name: string; address: string; phone: string; email: string }[]>;
  create(payload: { branchId: string; code: string; name: string; address: string; phone: string; email: string }): Promise<void>;
  update(payload: { branchId: string; code: string; name: string; address: string; phone: string; email: string }, originalCode?: string): Promise<void>;
  delete(branchId: string, code: string): Promise<void>;
}