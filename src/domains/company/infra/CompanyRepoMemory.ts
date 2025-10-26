import type { CompanyRepository, BranchRepository } from '../ports';
import type { Company, Branch } from '../entities';

export class CompanyRepoMemory implements CompanyRepository {
  private companies: Company[] = [
    { id: '1', name: 'Empresa Demo' }
  ];

  async listCompanies(): Promise<{id: string; name: string}[]> {
    return this.companies.map(c => ({ id: c.id, name: c.name }));
  }
}

export class BranchRepoMemory implements BranchRepository {
  private branches: Branch[] = [];

  async createBranch(companyId: string, name: string, code: string): Promise<{ ok: true; branch: Branch } | { ok: false; error: string }> {
    const branch: Branch = {
      id: crypto.randomUUID(),
      companyId,
      name,
      code,
    };
    this.branches.push(branch);
    return { ok: true, branch };
  }

  async listByCompany(companyId: string): Promise<Branch[]> {
    return this.branches.filter(b => b.companyId === companyId);
  }

  // Métodos adicionales para la nueva funcionalidad
  async list(): Promise<Branch[]> {
    return this.branches;
  }

  async create(payload: { id: string; name: string; address: string; ubigeo: string }): Promise<void> {
    const branch: Branch = {
      id: payload.id,
      companyId: '1', // Por defecto asociamos a la empresa demo
      name: payload.name,
      code: payload.ubigeo, // Usamos ubigeo como código
    };
    this.branches.push(branch);
  }

  async delete(id: string): Promise<void> {
    this.branches = this.branches.filter(b => b.id !== id);
  }
}