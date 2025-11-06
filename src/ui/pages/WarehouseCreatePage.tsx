import React, { useEffect, useState } from "react";
import { ApiService } from "../../core/api-service";
import type { BranchListItem, WarehouseListItem, LocationResponse } from "../../core/api-types";

type WarehouseRow = WarehouseListItem;

export default function WarehousePage() {

  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [branchId, setBranchId] = useState<string>("");

  const [list, setList] = useState<WarehouseRow[]>([]);
  const [q, setQ] = useState("");

  // Modal crear almacén
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

  // Modal ver almacén
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseRow | null>(null);
  const [shelves, setShelves] = useState<LocationResponse[]>([]);
  const [loadingShelves, setLoadingShelves] = useState(false);
  const [shelfError, setShelfError] = useState<string | null>(null);
  const [newShelfCode, setNewShelfCode] = useState("");

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

  async function openWarehouseView(warehouse: WarehouseRow) {
    setSelectedWarehouse(warehouse);
    setViewModalOpen(true);
    setShelfError(null);
    setNewShelfCode("");
    setLoadingShelves(true);
    
    try {
      const result = await ApiService.getLocationsByWarehouse(warehouse.warehouseId, true);
      if (result.ok) {
        setShelves(result.data);
      } else {
        setShelfError(result.error);
        setShelves([]);
      }
    } catch (error) {
      console.error('Error loading shelves:', error);
      setShelfError('Error al cargar estanterías');
      setShelves([]);
    } finally {
      setLoadingShelves(false);
    }
  }

  async function addShelf(codeName: string) {
    if (!codeName.trim() || !selectedWarehouse) return;
    
    setShelfError(null);
    setLoadingShelves(true);
    
    try {
      const result = await ApiService.createLocation(selectedWarehouse.warehouseId, {
        code: codeName.trim(),
        allowStock: true,
      });
      
      if (result.ok) {
        setShelves(prev => [...prev, result.data]);
        setNewShelfCode(""); // Limpiar input solo si se crea exitosamente
      } else {
        setShelfError(result.error);
      }
    } catch (error) {
      console.error('Error creating shelf:', error);
      setShelfError('Error al crear estantería');
    } finally {
      setLoadingShelves(false);
    }
  }

  function removeShelf(locationId: number) {
    // TODO: Implementar endpoint de eliminación cuando esté disponible
    // Por ahora solo eliminamos del estado local
    setShelves(prev => prev.filter(shelf => shelf.locationId !== locationId));
  }

  function updateShelf(locationId: number, value: string) {
    // TODO: Implementar endpoint de actualización cuando esté disponible
    // Por ahora solo actualizamos el estado local
    setShelves(prev => prev.map(shelf => 
      shelf.locationId === locationId ? { ...shelf, code: value } : shelf
    ));
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Almacenes</h1>
        <div className="flex items-center gap-4">
          <select
            className="select w-full sm:w-64"
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          className="input flex-1 min-w-0"
          placeholder="Buscar Almacenes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-primary w-full sm:w-auto whitespace-nowrap" onClick={startCreate}>
          Nuevo almacén
        </button>
      </div>

      {/* Cards de Almacenes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
            Sin datos
          </div>
        )}
        {filtered.map((w) => {
          return (
            <div 
              key={`${w.branchId}:${w.warehouseCode}`} 
              className="card cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => openWarehouseView(w)}
            >
              <div className="card-inner">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{w.warehouseName}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{w.warehouseCode}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[hsl(var(--muted-foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-[hsl(var(--foreground))]">{w.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[hsl(var(--muted-foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[hsl(var(--foreground))]">{w.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[hsl(var(--muted-foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[hsl(var(--foreground))]">{w.contact}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nuevo almacén */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

      {/* Modal Ver Almacén */}
      {viewModalOpen && selectedWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm p-4">
          <div className="card w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="card-inner">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  {selectedWarehouse.warehouseName}
                </h2>
                <button 
                  className="btn" 
                  onClick={() => setViewModalOpen(false)}
                >
                  Cerrar
                </button>
              </div>

              {/* Información del Almacén */}
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-[var(--radius)] mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Código</label>
                    <p className="text-gray-900">{selectedWarehouse.warehouseCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teléfono</label>
                    <p className="text-gray-900">{selectedWarehouse.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Dirección</label>
                    <p className="text-gray-900">{selectedWarehouse.address}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Correo de contacto</label>
                    <p className="text-gray-900">{selectedWarehouse.contact}</p>
                  </div>
                </div>
              </div>

              {/* Gestión de Estanterías */}
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Estanterías</h3>
                
                {shelfError && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200 mb-4">
                    {shelfError}
                  </div>
                )}
                
                {/* Input para agregar estantería */}
                <div className="flex gap-2 mb-4 items-center">
                  <input
                    className="input flex-1"
                    placeholder="Escribe el código de la estantería"
                    value={newShelfCode}
                    onChange={(e) => setNewShelfCode(e.target.value)}
                    disabled={loadingShelves}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loadingShelves && newShelfCode.trim()) {
                        addShelf(newShelfCode);
                      }
                    }}
                  />
                  <button 
                    className="btn-primary h-fit"
                    disabled={loadingShelves || !newShelfCode.trim()}
                    onClick={() => {
                      if (newShelfCode.trim()) {
                        addShelf(newShelfCode);
                      }
                    }}
                  >
                    {loadingShelves ? "Creando..." : "Crear"}
                  </button>
                </div>

                {/* Lista de estanterías */}
                <div className="max-h-80 overflow-y-auto">
                  {loadingShelves && shelves.length === 0 ? (
                    <div className="text-center py-8 text-[hsl(var(--muted-foreground))] bg-gray-50 rounded-[var(--radius)] border border-gray-200">
                      Cargando estanterías...
                    </div>
                  ) : shelves.length === 0 ? (
                    <div className="text-center py-8 text-[hsl(var(--muted-foreground))] bg-gray-50 rounded-[var(--radius)] border border-gray-200">
                      No hay estanterías registradas
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-[var(--radius)] overflow-hidden">
                      {shelves.map((shelf, index) => (
                        <div 
                          key={shelf.locationId} 
                          className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                            index !== shelves.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <input
                              className="w-full text-sm py-1 bg-transparent border-none focus:bg-white focus:border focus:border-gray-300 focus:rounded px-2 transition-all"
                              value={shelf.code}
                              onChange={(e) => updateShelf(shelf.locationId, e.target.value)}
                              placeholder="Código de estantería"
                              disabled
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              onClick={() => {
                                const newCode = prompt('Nuevo código:', shelf.code);
                                if (newCode && newCode.trim()) {
                                  updateShelf(shelf.locationId, newCode.trim());
                                }
                              }}
                              title="Modificar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              onClick={() => removeShelf(shelf.locationId)}
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
