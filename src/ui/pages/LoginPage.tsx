import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthService } from "../../core/auth-service";

export default function LoginPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ 
    email: import.meta.env.DEV ? "admin@megamarket.pe" : "", 
    password: import.meta.env.DEV ? "Giga$h0p2025" : "" 
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); 
    setError(null);
    setLoading(true);

    try {
      const result = await AuthService.login({
        email: form.email,
        password: form.password,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Login successful, redirect to home
      nav("/app/home");
    } catch (error) {
      console.error(error);
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card card-inner">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center text-lg font-bold">
              ✦
            </div>
            <div className="text-xl font-semibold text-[hsl(var(--foreground))]">ERP</div>
          </div>
          
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Iniciar Sesión</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-8">Accede a tu panel de control de ERP.</p>
          
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Correo Electrónico
              </label>
              <input 
                className="input" 
                type="email"
                placeholder="example@gmail.com" 
                value={form.email} 
                onChange={e=>setForm(f=>({...f, email: e.target.value}))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Contraseña
              </label>
              <input 
                className="input" 
                type="password" 
                placeholder="********"
                value={form.password} 
                onChange={e=>setForm(f=>({...f, password: e.target.value}))} 
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
                {error}
              </div>
            )}
            
            <button 
              className="w-full btn-primary text-lg py-4" 
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
            
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              ¿No tienes cuenta?{" "}
              <Link to="/signup" className="link font-medium">
                Crear cuenta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
