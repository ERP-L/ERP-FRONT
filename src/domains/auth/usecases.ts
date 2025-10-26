import type { AuthRepository } from './ports';
import type { User } from './entities';

export class AuthUseCases {
  private authRepo: AuthRepository;

  constructor(authRepo: AuthRepository) {
    this.authRepo = authRepo;
  }

  async login(username: string, password: string): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
    return this.authRepo.login(username, password);
  }

  async registerCompanyAndAdmin(userData: { companyName: string; address: string; phone: string; taxId: string; adminFullName: string; adminUsername: string; adminPassword: string }): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
    return this.authRepo.registerCompanyAndAdmin(userData);
  }

  async me(): Promise<User | null> {
    return this.authRepo.me();
  }

  async logout(): Promise<void> {
    return this.authRepo.logout();
  }
}
