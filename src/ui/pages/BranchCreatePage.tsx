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
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Sucursales</h1>

      {/* Buscador + botón crear */}
      <div className="flex items-center gap-4">
        <input
          className="input flex-1"
          placeholder="Buscar sucursal…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button 
          className="btn-primary" 
          onClick={() => { setForm({ name: "", address: "", ubigeo: "" }); setOpen(true); }}
        >
          Nueva sucursal
        </button>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--accent))]">
              <tr className="text-left">
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Sucursal ID</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Nombre</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Dirección</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Ubigeo</th>
                {/* <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium w-40">Acciones</th> */}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={4}>
                    Sin datos
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr key={String(b.branchId)} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                    {b.branchId}
                  </td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                    {b.name}
                  </td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                    {b.address ?? ""}
                  </td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                    {b.ubigeoId ?? ""}
                  </td>
                  {/* <td className="px-6 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2">
                      <button 
                        className="btn text-xs px-3 py-1" 
                        onClick={() => startEdit(b)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn text-xs px-3 py-1 text-red-600 border-red-200 hover:bg-red-50" 
                        onClick={() => remove(String(b.branchId))}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva sucursal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 rounded-3xl backdrop-blur-sm">
          <div className="card w-full max-w-lg mx-4">
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
