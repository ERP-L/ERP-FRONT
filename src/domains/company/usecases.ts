import type { CompanyRepository, BranchRepository } from './ports';
import type { Branch } from './entities';

export class CompanyUseCases {
  private companyRepo: CompanyRepository;
  private branchRepo: BranchRepository;

  constructor(
    companyRepo: CompanyRepository,
    branchRepo: BranchRepository
  ) {
    this.companyRepo = companyRepo;
    this.branchRepo = branchRepo;
  }

  async listCompanies(): Promise<{ id: string; name: string }[]> {
    return this.companyRepo.listCompanies();
  }

  async createBranch(companyId: string, name: string, code: string): Promise<{ ok: true; branch: Branch } | { ok: false; error: string }> {
    return this.branchRepo.createBranch(companyId, name, code);
  }

  async listBranches(companyId: string): Promise<Branch[]> {
    return this.branchRepo.listByCompany(companyId);
  }
}
