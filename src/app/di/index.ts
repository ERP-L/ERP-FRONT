import type { AuthRepository } from "../../domains/auth/ports";
import { AuthRepoMemory } from "../../domains/auth/infra/AuthRepoMemory";
import { BranchRepoMemory, CompanyRepoMemory } from "../../domains/company/infra/CompanyRepoMemory";
import { WarehouseRepoMemory } from "../../domains/warehouse/infra/WarehouseRepoMemory";
import { ProductRepoMemory } from "../../domains/product/infra/ProductRepoMemory";
import { InventoryRepoMemory } from "../../domains/inventory/infra/InventoryRepoMemory";
import type { BranchRepository, CompanyRepository } from "../../domains/company/ports";
import type { WarehouseRepository } from "../../domains/warehouse/ports";
import type { ProductRepository } from "../../domains/product/ports";
import type { InventoryRepository } from "../../domains/inventory/ports";

export const container = {
  authRepo: new AuthRepoMemory() as AuthRepository,
  companyRepo: new CompanyRepoMemory() as CompanyRepository,
  branchRepo: new BranchRepoMemory() as BranchRepository,
  warehouseRepo: new WarehouseRepoMemory() as WarehouseRepository,
  productRepo: new ProductRepoMemory() as ProductRepository,
  inventoryRepo: new InventoryRepoMemory() as InventoryRepository,
};