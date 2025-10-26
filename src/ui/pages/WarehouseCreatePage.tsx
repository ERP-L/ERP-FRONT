import React, { useEffect, useState } from "react";
import { ApiService } from "../../core/api-service";
import type { BranchListItem, WarehouseListItem } from "../../core/api-types";

type WarehouseRow = WarehouseListItem;

export default function WarehousePage() {

  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [branchId, setBranchId] = useState<string>("");

  const [list, setList] = useState<WarehouseRow[]>([]);
  const [q, setQ] = useState("");

  // Modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    branchId: string;
    code: string;
    name: string;
    address: string;
    phone: string;
    email: string;
  }>({
    branchId: "",
    code: "",
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  // editar vs crear
  const [editing, setEditing] = useState(false);
  const [originalCode, setOriginalCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await ApiService.getBranches();
        if (result.ok) {
          setBranches(result.data);
          if (result.data.length && !branchId) setBranchId(String(result.data[0].branchId));
        } else {
          console.error('Error loading branches:', result.error);
          setBranches([]);
        }
      } catch (error) {
        console.error('Error loading branches:', error);
        setBranches([]);
      }
    })();
  }, [branchId]); // cargar sucursales

  useEffect(() => {
    (async () => {
      if (!branchId) { setList([]); return; }
      try {
        const result = await ApiService.getWarehousesByBranch(parseInt(branchId));
        if (result.ok) {
          setList(result.data);
        } else {
          console.error('Error loading warehouses:', result.error);
          setList([]);
        }
      } catch (error) {
        console.error('Error loading warehouses:', error);
        setList([]);
      }
    })();
  }, [branchId]); // listar almacenes por sucursal

  const filtered = list.filter((w) => {
    const t = q.toLowerCase();
    return (
      w.warehouseCode.toLowerCase().includes(t) ||
      w.warehouseName.toLowerCase().includes(t) ||
      w.address.toLowerCase().includes(t) ||
      w.phone.toLowerCase().includes(t) ||
      w.contact.toLowerCase().includes(t)
    );
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (editing) {
        // TODO: Implementar endpoint de actualización cuando esté disponible
        console.log('Update warehouse:', form, originalCode);
        setError("Función de edición no implementada aún");
        return;
      } else {
        // For creating, use the real API
        const result = await ApiService.createWarehouse({
          branchId: parseInt(form.branchId),
          warehouseCode: form.code,
          warehouseName: form.name,
          address: form.address,
          phone: form.phone,
          contact: form.email, // Using email as contact
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      
      // Refresh the list after successful creation
      const result = await ApiService.getWarehousesByBranch(parseInt(branchId));
      if (result.ok) {
        setList(result.data);
      }
      setOpen(false);
      setEditing(false);
      setOriginalCode(null);
      setForm({ branchId: "", code: "", name: "", address: "", phone: "", email: "" });
    } catch (error) {
      console.error('Error creating/updating warehouse:', error);
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setForm({ branchId: branchId, code: "", name: "", address: "", phone: "", email: "" });
    setEditing(false);
    setOriginalCode(null);
    setOpen(true);
  }

  // function startEdit(w: WarehouseRow) {
  //   setForm({
  //     branchId: String(w.branchId),
  //     code: w.warehouseCode,
  //     name: w.warehouseName,
  //     address: w.address,
  //     phone: w.phone,
  //     email: w.contact,
  //   });
  //   setEditing(true);
  //   setOriginalCode(w.warehouseCode);
  //   setOpen(true);
  // }

  // async function remove(code: string) {
  //   try {
  //     // TODO: Implementar endpoint de eliminación cuando esté disponible
  //     console.log('Delete warehouse:', code);
  //     // Por ahora solo refrescamos la lista
  //     const result = await ApiService.getWarehousesByBranch(parseInt(branchId));
  //     if (result.ok) {
  //       setList(result.data);
  //     }
  //   } catch (error) {
  //     console.error('Error deleting warehouse:', error);
  //   }
  // }

  return (
    <div className="space-y-6">
      {/* Título y Selector de sucursal */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Almacenes</h1>
        <div className="flex items-center gap-4">
          <select
            className="select w-64"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {branches.map((b) => (
              <option key={String(b.branchId)} value={String(b.branchId)}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buscador + botón crear */}
      <div className="flex items-center gap-4">
        <input
          className="input flex-1"
          placeholder="Buscar Almacenes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-primary" onClick={startCreate}>
          Nuevo almacén
        </button>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--accent))]">
              <tr className="text-left">
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Código</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Nombre</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Teléfono</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Dirección</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Correo</th>
                {/* <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium w-40">Acciones</th> */}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={5}>
                    Sin datos
                  </td>
                </tr>
              )}
              {filtered.map((w) => (
                <tr key={`${w.branchId}:${w.warehouseCode}`} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">{w.warehouseCode}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">{w.warehouseName}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">{w.phone}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">{w.address}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">{w.contact}</td>
                  {/* <td className="px-6 py-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2">
                      <button className="btn text-xs px-3 py-1" onClick={() => startEdit(w)}>
                        Editar
                      </button>
                      <button
                        className="btn text-xs px-3 py-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => remove(w.warehouseCode)}
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

      {/* Modal Nuevo almacén */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <div className="card w-full max-w-lg mx-4">
            <div className="card-inner">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6">Nuevo almacén</h2>
              <form className="space-y-4" onSubmit={submit}>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Sucursal</label>
                  <select
                    className="select"
                    value={form.branchId}
                    onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                    required
                  >
                    <option value="">Seleccione una sucursal</option>
                    {branches.map((b) => (
                      <option key={String(b.branchId)} value={String(b.branchId)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Código</label>
                  <input
                    className="input"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Nombre</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Dirección</label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Teléfono</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Correo de contacto</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button type="button" className="btn" onClick={() => { setOpen(false); setEditing(false); }}>
                    Cancelar
                  </button>
                  <button 
                    className="btn-primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (editing ? "Actualizando..." : "Creando...") : (editing ? 'Actualizar' : 'Crear')}
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
