import type { Branch } from './entities';

export interface CompanyRepository {
  listCompanies(): Promise<{id: string; name: string}[]>;
}

export interface BranchRepository {
  createBranch(companyId: string, name: string, code: string): Promise<{ ok: true; branch: Branch } | { ok: false; error: string }>;
  listByCompany(companyId: string): Promise<Branch[]>;
  list(): Promise<Branch[]>;

  
  // ⬇️ agrega estas dos firmas que usa tu pantalla
  create(payload: { id: string; name: string; address: string; ubigeo: string }): Promise<void>;
  delete(id: string): Promise<void>;
}