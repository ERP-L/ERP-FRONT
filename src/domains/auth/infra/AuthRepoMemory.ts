import type { AuthRepository } from "../ports";
import type { User } from "../entities";


export class AuthRepoMemory implements AuthRepository {
private users: Array<User & { password: string }> = [];
private current: string | null = null;


async login(username: string, password: string) {
const u = this.users.find(x => x.username === username && x.password === password);
if (!u) return { ok: false as const, error: "Credenciales inválidas" };
this.current = u.id; return { ok: true as const, user: u };
}


async registerCompanyAndAdmin(input: {
companyName: string; address: string; phone: string; taxId: string;
adminFullName: string; adminUsername: string; adminPassword: string;
}) {
if (this.users.some(u => u.username === input.adminUsername))
return { ok: false as const, error: "El usuario ya existe" };
// Demo: aquí guardarías empresa y admin en BD. Solo creamos user.
const user: User & { password: string } = {
id: crypto.randomUUID(),
email: `${input.adminUsername}@demo.local`,
username: input.adminUsername,
password: input.adminPassword,
};
this.users.push(user); this.current = user.id;
return { ok: true as const, user: { id: user.id, email: user.email, username: user.username } };
}


async me() { return this.users.find(u => u.id === this.current) ?? null; }
async logout() { this.current = null; }
}