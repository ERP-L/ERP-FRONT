import React, { useEffect, useState } from "react";
import { ApiService } from "../../core/api-service";
import type { BranchListItem } from "../../core/api-types";

type BranchRow = BranchListItem;

export default function BranchCreatePage() {

  const [list, setList] = useState<BranchRow[]>([]);
  const [q, setQ] = useState("");

  // Modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; address: string; ubigeo: string }>({
    name: "",
    address: "",
    ubigeo: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Obtiene todas las sucursales desde la API real
    (async () => {
      try {
        const result = await ApiService.getBranches();
        if (result.ok) {
          setList(result.data);
        } else {
          console.error('Error loading branches:', result.error);
          setList([]);
        }
      } catch (error) {
        console.error('Error loading branches:', error);
        setList([]);
      }
    })();
  }, []);

  const filtered = list.filter((b) => {
    const t = (q || "").toLowerCase();
    return (
      (b.branchId ?? "").toString().toLowerCase().includes(t) ||
      (b.name ?? "").toLowerCase().includes(t) ||
      (b.address ?? "").toLowerCase().includes(t) ||
      (b.ubigeoId ?? "").toLowerCase().includes(t)
    );
  });

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const result = await ApiService.createBranch({
        name: form.name,
        address: form.address,
        ubigeoId: form.ubigeo,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Refresh the list after successful creation
      const refreshResult = await ApiService.getBranches();
      if (refreshResult.ok) {
        setList(refreshResult.data);
      }
      setOpen(false);
      setForm({ name: "", address: "", ubigeo: "" });
    } catch (error) {
      console.error('Error creating branch:', error);
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // function startEdit(b: BranchRow) {
  //   // Abre el mismo modal precargado (el título queda "Nueva sucursal" como indicaste)
  //   setForm({
  //     name: b.name ?? "",
  //     address: b.address ?? "",
  //     ubigeo: b.ubigeoId ?? "",
  //   });
  //   setOpen(true);
  // }

  // async function remove(id: string) {
  //   try {
  //     // TODO: Implementar endpoint de eliminación cuando esté disponible
  //     console.log('Delete branch:', id);
  //     // Por ahora solo refrescamos la lista
  //     const refreshResult = await ApiService.getBranches();
  //     if (refreshResult.ok) {
  //       setList(refreshResult.data);
  //     }
  //   } catch {
  //     // Silencioso
  //   }
  // }

  return (
    <div className="space-y-6">
      {/* Título */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Sucursales</h1>

      {/* Buscador + botón crear */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          className="input flex-1 min-w-0"
          placeholder="Buscar sucursal…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button 
          className="btn-primary w-full sm:w-auto whitespace-nowrap" 
          onClick={() => { setForm({ name: "", address: "", ubigeo: "" }); setOpen(true); }}
        >
          Nueva sucursal
        </button>
      </div>

      {/* Cards de Sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
            Sin datos
          </div>
        )}
        {filtered.map((b) => (
          <div key={String(b.branchId)} className="card cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <div className="card-inner">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{b.name}</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">ID: {b.branchId}</p>
                </div>
                <div className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] px-3 py-1 rounded-full text-xs font-medium">
                  {b.ubigeoId ?? "Sin ubigeo"}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[hsl(var(--muted-foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[hsl(var(--foreground))]">{b.address ?? "Sin dirección"}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva sucursal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="card-inner">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6">Nueva sucursal</h2>
              <form className="space-y-4" onSubmit={submitNew}>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Nombre
                  </label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Dirección
                  </label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Ubigeo
                  </label>
                  <input
                    className="input"
                    value={form.ubigeo}
                    onChange={(e) => setForm((f) => ({ ...f, ubigeo: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn-primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Creando..." : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
