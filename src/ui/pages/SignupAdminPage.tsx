import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthService } from "../../core/auth-service";

export default function SignupAdminPage() {
  const nav = useNavigate();
  const location = useLocation();
  const companyData = location.state?.companyData;
  
  // Debug: mostrar datos recibidos
  console.log('Datos de empresa recibidos:', companyData);
  
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    username: "", 
    password: "",
    phone: "",
    documentTypeId: "1",
    documentNumber: "",
    gender: "M"
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); 
    setError(null);
    setLoading(true);

    try {
      // Prepare signup data
      const signupData = {
        company: {
          legalName: companyData?.legalName || "",
          documentTypeId: parseInt(companyData?.documentTypeId || "3"),
          documentNumber: companyData?.documentNumber || "",
          tradeName: companyData?.tradeName || "",
          address: companyData?.address || "",
          ubigeoId: parseInt(companyData?.ubigeoId || "150122"),
          phone: companyData?.phone || "",
          email: companyData?.email || "",
        },
        securityUser: {
          email: form.email,
          username: form.username,
          password: form.password,
        },
        tenantUser: {
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender,
          phone: form.phone,
          documentTypeId: parseInt(form.documentTypeId),
          documentNumber: form.documentNumber,
        },
      };

      const result = await AuthService.signup(signupData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // After successful signup, automatically login
      const loginResult = await AuthService.login({
        email: form.email,
        password: form.password,
      });

      if (!loginResult.ok) {
        setError("Registro exitoso, pero error al iniciar sesión. Por favor, inicia sesión manualmente.");
        return;
      }

      // Redirect to home
      nav("/app/home");
    } catch (error) {
      console.error(error);
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="card card-inner">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center text-lg font-bold">
              ✦
            </div>
            <div className="text-xl font-semibold text-[hsl(var(--foreground))]">ERP</div>
          </div>
          
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Crear tu cuenta</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">Completa los pasos para configurar tu empresa.</p>
          
          {/* Progress Bar */}
          <div className="h-2 bg-[hsl(var(--accent))] rounded-full mb-6">
            <div className="h-2 bg-[hsl(var(--primary))] rounded-full w-full"></div>
          </div>

          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
            👤 Administrador General
          </h2>
          
          {/* Mostrar datos de empresa cargados */}
          {companyData && (
            <div className="mb-6 p-4 bg-[hsl(var(--accent))] rounded-lg">
              <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                📋 Datos de la Empresa
              </h3>
              <div className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                <div><strong>Empresa:</strong> {companyData.legalName}</div>
                <div><strong>Nombre Comercial:</strong> {companyData.tradeName}</div>
                <div><strong>Documento:</strong> {companyData.documentNumber}</div>
              </div>
            </div>
          )}
          
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Nombre
                </label>
                <input 
                  className="input" 
                  placeholder="Juan" 
                  value={form.firstName} 
                  onChange={e=>setForm(f=>({...f, firstName: e.target.value}))} 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Apellidos
                </label>
                <input 
                  className="input" 
                  placeholder="Pérez García" 
                  value={form.lastName} 
                  onChange={e=>setForm(f=>({...f, lastName: e.target.value}))} 
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Correo Electrónico
              </label>
              <input 
                className="input" 
                type="email"
                placeholder="admin@megamarket.pe" 
                value={form.email} 
                onChange={e=>setForm(f=>({...f, email: e.target.value}))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Nombre de Usuario
              </label>
              <input 
                className="input" 
                placeholder="admin_megamarket" 
                value={form.username} 
                onChange={e=>setForm(f=>({...f, username: e.target.value}))} 
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
                placeholder="Giga$h0p2025"
                value={form.password} 
                onChange={e=>setForm(f=>({...f, password: e.target.value}))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Teléfono
              </label>
              <input 
                className="input" 
                placeholder="912345678" 
                value={form.phone} 
                onChange={e=>setForm(f=>({...f, phone: e.target.value}))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Género
              </label>
              <select 
                className="select" 
                value={form.gender} 
                onChange={e=>setForm(f=>({...f, gender: e.target.value}))} 
                required
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Tipo de Documento
              </label>
              <select 
                className="select" 
                value={form.documentTypeId} 
                onChange={e=>setForm(f=>({...f, documentTypeId: e.target.value}))} 
                required
              >
                <option value="1">DNI</option>
                <option value="2">Carné de Extranjería</option>
                <option value="3">RUC</option>
                <option value="4">Pasaporte</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Número de Documento
              </label>
              <input 
                className="input" 
                placeholder="45678912" 
                value={form.documentNumber} 
                onChange={e=>setForm(f=>({...f, documentNumber: e.target.value}))} 
                required
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
                {error}
              </div>
            )}
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => {
                  console.log('Navegando de vuelta con datos:', companyData);
                  nav('/signup/company', { 
                    state: { 
                      companyData: companyData,
                      preserveData: true 
                    } 
                  });
                }} 
                className="btn flex-1"
              >
                Volver
              </button>
              <button 
                className="btn-primary flex-1 text-lg py-4"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </div>
            
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/login" className="link font-medium">
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
