import type { User } from "./entities";

export interface AuthRepository {
    login(username: string, password: string): Promise<{ ok: true; user: User } | { ok: false; error: string }>;
    registerCompanyAndAdmin(input: {
    companyName: string; address: string; phone: string; taxId: string;
    adminFullName: string; adminUsername: string; adminPassword: string;
    }): Promise<{ ok: true; user: User } | { ok: false; error: string }>;
    me(): Promise<User | null>;
    logout(): Promise<void>;
    }