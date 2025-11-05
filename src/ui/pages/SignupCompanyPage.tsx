import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function SignupCompanyPage() {
  const nav = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ 
    legalName: "", 
    tradeName: "", 
    documentTypeId: "3", 
    documentNumber: "", 
    address: "", 
    ubigeoId: "150122", 
    phone: "", 
    email: "" 
  });

  // Cargar datos guardados del estado del navegador
  useEffect(() => {
    if (location.state?.companyData) {
      console.log('Cargando datos de empresa:', location.state.companyData);
      setForm(location.state.companyData);
    }
  }, [location.state]);

  function next(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate required fields
    if (!form.legalName.trim() || !form.tradeName.trim() || !form.documentNumber.trim() || 
        !form.address.trim() || !form.phone.trim() || !form.email.trim()) {
      return;
    }
    
    // Guardar datos en el estado del navegador para poder regresar
    nav(`/signup/admin`, { 
      state: { 
        companyData: form,
        fromCompany: true 
      } 
    });
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
            <div className="h-2 bg-[hsl(var(--primary))] rounded-full w-1/2"></div>
          </div>

          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
            🏢 Datos de la Empresa
          </h2>
          
          {/* Mostrar si los datos fueron cargados */}
          {location.state?.companyData && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-700">
                ✅ Datos cargados - Puedes modificar la información si es necesario
              </div>
            </div>
          )}
          
          <form onSubmit={next} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Nombre Legal de la Empresa
              </label>
              <input 
                className="input" 
                placeholder="MEGAMARKET PERÚ S.A.C." 
                value={form.legalName} 
                onChange={e=>setForm(f=>({...f, legalName: e.target.value}))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Nombre Comercial
              </label>
              <input 
                className="input" 
                placeholder="MEGAMARKET" 
                value={form.tradeName} 
                onChange={e=>setForm(f=>({...f, tradeName: e.target.value}))} 
                required
              />
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
                placeholder="20614573219" 
                value={form.documentNumber} 
                onChange={e=>setForm(f=>({...f, documentNumber: e.target.value}))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Dirección
              </label>
              <input 
                className="input" 
                placeholder="Av. Javier Prado Este 4560, San Borja, Lima" 
                value={form.address} 
                onChange={e=>setForm(f=>({...f, address: e.target.value}))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Ubigeo ID
              </label>
              <input 
                className="input" 
                placeholder="150122" 
                value={form.ubigeoId} 
                onChange={e=>setForm(f=>({...f, ubigeoId: e.target.value}))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Teléfono
              </label>
              <input 
                className="input" 
                placeholder="913456789" 
                value={form.phone} 
                onChange={e=>setForm(f=>({...f, phone: e.target.value}))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Correo de Contacto
              </label>
              <input 
                className="input" 
                type="email"
                placeholder="contacto@megamarket.pe" 
                value={form.email} 
                onChange={e=>setForm(f=>({...f, email: e.target.value}))} 
                required
              />
            </div>
            
            <button className="w-full btn-primary text-lg py-4">
              Siguiente
            </button>
            
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              ¿Ya tienes cuenta?{" "}
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