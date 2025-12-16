import { useState, useEffect } from "react";
import { ApiService } from "../../core/api-service";
import { AuthService } from "../../core/auth-service";
import type { BranchListItem, AreaResponse, CostCenterResponse } from "../../core/api-types";

type User = {
  id: number;
  name: string;
  email: string;
};

type Area = AreaResponse & {
  branchName: string;
  responsibleUserName: string;
  costCenters: CostCenterResponse[];
};

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh]">
        <div className="card">
          <div className="card-inner flex flex-col h-[85vh] max-h-[90vh] sm:max-h-[700px] overflow-hidden">
            <div className="flex items-start justify-between mb-4 flex-shrink-0">
              <h3 className="text-xl font-semibold">{title}</h3>
              <button className="btn" onClick={onClose} aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {children}
            </div>
            {footer && (
              <div className="flex-shrink-0 pt-4 border-t border-[hsl(var(--border))] mt-4">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AreasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Mock usuarios - En producción esto vendría de la API
  const [users] = useState<User[]>([
  ]);

  // Modal crear área
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    code: "",
    description: "",
    responsibleUserId: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [loadingCostCenters, setLoadingCostCenters] = useState(false);

  // Modal ver/editar área
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    responsibleUserId: "",
  });
  const [editingFields, setEditingFields] = useState({
    name: false,
    description: false,
    responsibleUserId: false,
  });
  const [costCenters, setCostCenters] = useState<CostCenterResponse[]>([]);
  const [newCostCenter, setNewCostCenter] = useState({ code: "", name: "", description: "" });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Cargar sucursales
  useEffect(() => {
    (async () => {
      setLoadingBranches(true);
      try {
        const result = await ApiService.getBranches();
        if (result.ok) {
          setBranches(result.data);
          if (result.data.length > 0 && !selectedBranchId) {
            setSelectedBranchId(String(result.data[0].branchId));
          }
        } else {
          console.error('Error loading branches:', result.error);
          setBranches([]);
        }
      } catch (error) {
        console.error('Error loading branches:', error);
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar áreas cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (!selectedBranchId) {
      setAreas([]);
      return;
    }

    (async () => {
      setLoadingAreas(true);
      try {
        const result = await ApiService.getAreasByBranch(parseInt(selectedBranchId));
        if (result.ok) {
          const branch = branches.find(b => String(b.branchId) === selectedBranchId);
          const areasWithExtras: Area[] = await Promise.all(
            result.data.items.map(async (area) => {
              // Cargar centros de costos para cada área
              const costCentersResult = await ApiService.getCostCentersByArea(area.areaId);
              const costCenters = costCentersResult.ok ? costCentersResult.data.items : [];
              
              // Obtener nombre del usuario responsable (mock por ahora)
              const user = users.find(u => u.id === area.userInChargeId);
              
              return {
                ...area,
                branchName: branch?.name || "",
                responsibleUserName: user?.name || `Usuario ${area.userInChargeId}`,
                costCenters: costCenters,
              };
            })
          );
          setAreas(areasWithExtras);
        } else {
          console.error('Error loading areas:', result.error);
          setAreas([]);
        }
      } catch (error) {
        console.error('Error loading areas:', error);
        setAreas([]);
      } finally {
        setLoadingAreas(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, branches]);

  // Filtrar áreas por búsqueda (ya están filtradas por sucursal)
  const filteredAreas = areas.filter(area => {
    const matchesSearch = !searchTerm || 
      area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Crear nueva área
  async function handleCreateArea(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    
    if (!createForm.name || !createForm.code || !createForm.description) {
      setCreateError("Todos los campos son requeridos");
      return;
    }

    if (!selectedBranchId) {
      setCreateError("Debe seleccionar una sucursal");
      return;
    }

    setCreateLoading(true);
    try {
      const session = AuthService.getCurrentSession();
      const userInChargeId = createForm.responsibleUserId 
        ? parseInt(createForm.responsibleUserId) 
        : (session?.authUserId || 1);

      const result = await ApiService.createArea({
        branchId: parseInt(selectedBranchId),
        name: createForm.name,
        code: createForm.code,
        description: createForm.description,
        userInChargeId: userInChargeId,
      });

      if (result.ok) {
        const branch = branches.find(b => String(b.branchId) === selectedBranchId);
        const user = users.find(u => u.id === result.data.userInChargeId);
        
        const newArea: Area = {
          ...result.data,
          branchName: branch?.name || "",
          responsibleUserName: user?.name || `Usuario ${result.data.userInChargeId}`,
          costCenters: [],
        };

        setAreas(prev => [...prev, newArea]);
        setOpenCreateModal(false);
        setCreateForm({ name: "", code: "", description: "", responsibleUserId: "" });
      } else {
        setCreateError(result.error);
      }
    } catch (error) {
      console.error('Error creating area:', error);
      setCreateError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setCreateLoading(false);
    }
  }

  // Abrir modal de ver/editar área
  async function handleOpenAreaView(area: Area) {
    setSelectedArea(area);
    setEditForm({
      name: area.name,
      description: area.description,
      responsibleUserId: String(area.userInChargeId),
    });
    setEditingFields({ name: false, description: false, responsibleUserId: false });
    setUpdateError(null);
    setOpenViewModal(true);
    
    // Cargar centros de costos desde la API
    setLoadingCostCenters(true);
    try {
      const result = await ApiService.getCostCentersByArea(area.areaId);
      if (result.ok) {
        setCostCenters(result.data.items);
      } else {
        console.error('Error loading cost centers:', result.error);
        setCostCenters([]);
      }
    } catch (error) {
      console.error('Error loading cost centers:', error);
      setCostCenters([]);
    } finally {
      setLoadingCostCenters(false);
    }
  }

  // Guardar cambios del área
  async function handleUpdateArea() {
    if (!selectedArea) return;

    setUpdateError(null);
    setUpdateLoading(true);
    try {
      // TODO: Implementar endpoint de actualización cuando esté disponible
      // Por ahora solo actualizamos localmente
      const selectedUser = users.find(u => u.id === parseInt(editForm.responsibleUserId));
      
      setAreas(prev => prev.map(area => 
        area.areaId === selectedArea.areaId
          ? {
              ...area,
              name: editForm.name,
              description: editForm.description,
              userInChargeId: parseInt(editForm.responsibleUserId),
              responsibleUserName: selectedUser?.name || area.responsibleUserName,
            }
          : area
      ));
      
      setSelectedArea(prev => prev ? {
        ...prev,
        name: editForm.name,
        description: editForm.description,
        userInChargeId: parseInt(editForm.responsibleUserId),
        responsibleUserName: selectedUser?.name || prev.responsibleUserName,
      } : null);
      
      setEditingFields({ name: false, description: false, responsibleUserId: false });
    } catch (error) {
      console.error('Error updating area:', error);
      setUpdateError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setUpdateLoading(false);
    }
  }

  // Agregar centro de costos
  async function handleAddCostCenter() {
    if (!newCostCenter.code || !newCostCenter.name || !selectedArea) return;
    
    setUpdateLoading(true);
    try {
      const result = await ApiService.createCostCenter({
        areaId: selectedArea.areaId,
        code: newCostCenter.code,
        name: newCostCenter.name,
        description: newCostCenter.description || newCostCenter.name,
      });

      if (result.ok) {
        setCostCenters(prev => [...prev, result.data]);
        setNewCostCenter({ code: "", name: "", description: "" });
        
        // Actualizar el área en la lista
        setAreas(prev => prev.map(area => 
          area.areaId === selectedArea.areaId
            ? { ...area, costCenters: [...area.costCenters, result.data] }
            : area
        ));
      } else {
        setUpdateError(result.error);
      }
    } catch (error) {
      console.error('Error creating cost center:', error);
      setUpdateError("Error inesperado al crear centro de costos.");
    } finally {
      setUpdateLoading(false);
    }
  }

  // Eliminar centro de costos
  function handleRemoveCostCenter(costCenterId: number) {
    // TODO: Implementar endpoint de eliminación cuando esté disponible
    // Por ahora solo eliminamos localmente
    setCostCenters(prev => prev.filter(cc => cc.costCenterId !== costCenterId));
    
    if (selectedArea) {
      setAreas(prev => prev.map(area => 
        area.areaId === selectedArea.areaId
          ? { ...area, costCenters: area.costCenters.filter(cc => cc.costCenterId !== costCenterId) }
          : area
      ));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Áreas</h1>
        <select
          className="select w-full sm:w-64"
          value={selectedBranchId}
          disabled={loadingBranches}
          onChange={(e) => setSelectedBranchId(e.target.value)}
        >
          <option value="">Todas las sucursales</option>
          {branches.map((b) => (
            <option key={String(b.branchId)} value={String(b.branchId)}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          className="input flex-1 min-w-0"
          placeholder="Buscar áreas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn w-full sm:w-auto whitespace-nowrap">
          Filtrar
        </button>
        <button 
          className="btn-primary w-full sm:w-auto whitespace-nowrap" 
          onClick={() => {
            const session = AuthService.getCurrentSession();
            setCreateForm({
              name: "",
              code: "",
              description: "",
              responsibleUserId: session?.authUserId ? String(session.authUserId) : "",
            });
            setOpenCreateModal(true);
          }}
        >
          Nueva Área
        </button>
      </div>

      {/* Cards de Áreas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingAreas && (
          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
            Cargando áreas...
          </div>
        )}
        {!loadingAreas && filteredAreas.length === 0 && (
          <div className="col-span-full text-center py-12 text-[hsl(var(--muted-foreground))]">
            Sin datos
          </div>
        )}
        {filteredAreas.map((area) => (
          <div 
            key={area.areaId} 
            className="card cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            onClick={() => handleOpenAreaView(area)}
          >
            <div className="card-inner">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{area.name}</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Código: {area.code}</p>
                </div>
                <div className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] px-3 py-1 rounded-full text-xs font-medium">
                  {area.branchName}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[hsl(var(--muted-foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-[hsl(var(--foreground))]">{area.responsibleUserName}</span>
                </div>
                <div className="text-[hsl(var(--muted-foreground))] line-clamp-2">
                  {area.description}
                </div>
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{area.costCenters.length} centro{area.costCenters.length !== 1 ? 's' : ''} de costo{area.costCenters.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Crear Área */}
      <Modal
        open={openCreateModal}
        onClose={() => {
          setOpenCreateModal(false);
          setCreateForm({ name: "", code: "", description: "", responsibleUserId: "" });
          setCreateError(null);
        }}
        title="Nueva Área"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn"
              onClick={() => {
                setOpenCreateModal(false);
                setCreateForm({ name: "", code: "", description: "", responsibleUserId: "" });
                setCreateError(null);
              }}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={handleCreateArea}
              disabled={createLoading}
            >
              {createLoading ? "Creando..." : "Crear"}
            </button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateArea}>
          {createError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
              {createError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Nombre
            </label>
            <input
              className="input"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Código
            </label>
            <input
              className="input"
              value={createForm.code}
              onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Descripción
            </label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Usuario Encargado
            </label>
              <select
              className="select"
              value={createForm.responsibleUserId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, responsibleUserId: e.target.value }))}
            >
              <option value="">Seleccione un usuario (por defecto: usuario actual)</option>
              {users.map(user => (
                <option key={user.id} value={String(user.id)}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal: Ver/Editar Área */}
      <Modal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedArea(null);
          setEditingFields({ name: false, description: false, responsibleUserId: false });
          setUpdateError(null);
        }}
        title={selectedArea?.name || ""}
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn"
              onClick={() => {
                setOpenViewModal(false);
                setSelectedArea(null);
                setEditingFields({ name: false, description: false, responsibleUserId: false });
                setUpdateError(null);
              }}
            >
              Cerrar
            </button>
            {(editingFields.name || editingFields.description || editingFields.responsibleUserId) && (
              <button
                className="btn-primary"
                onClick={handleUpdateArea}
                disabled={updateLoading}
              >
                {updateLoading ? "Guardando..." : "Guardar Cambios"}
              </button>
            )}
          </div>
        }
      >
        {selectedArea && (
          <div className="space-y-6">
            {/* Sección: Información */}
            <div className="space-y-4">
              <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
                Información
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Nombre
                </label>
                {editingFields.name ? (
                  <input
                    className="input"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    onBlur={() => setEditingFields(prev => ({ ...prev, name: false }))}
                    autoFocus
                  />
                ) : (
                  <input
                    className="input"
                    value={editForm.name}
                    readOnly
                    onClick={() => setEditingFields(prev => ({ ...prev, name: true }))}
                    onFocus={() => setEditingFields(prev => ({ ...prev, name: true }))}
                  />
                )}
              </div>

              {/* Código (no modificable) */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Código
                </label>
                <input
                  className="input bg-[hsl(var(--muted))] cursor-not-allowed"
                  value={selectedArea.code}
                  readOnly
                  disabled
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Descripción
                </label>
                {editingFields.description ? (
                  <textarea
                    className="input min-h-[100px] resize-none"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    onBlur={() => setEditingFields(prev => ({ ...prev, description: false }))}
                    autoFocus
                  />
                ) : (
                  <textarea
                    className="input min-h-[100px] resize-none"
                    value={editForm.description}
                    readOnly
                    onClick={() => setEditingFields(prev => ({ ...prev, description: true }))}
                    onFocus={() => setEditingFields(prev => ({ ...prev, description: true }))}
                  />
                )}
              </div>

              {/* Usuario Encargado */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Usuario Encargado
                </label>
                {editingFields.responsibleUserId ? (
                  <select
                    className="select"
                    value={editForm.responsibleUserId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, responsibleUserId: e.target.value }))}
                    onBlur={() => setEditingFields(prev => ({ ...prev, responsibleUserId: false }))}
                    autoFocus
                  >
                    {users.map(user => (
                      <option key={user.id} value={String(user.id)}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    value={users.find(u => u.id === parseInt(editForm.responsibleUserId))?.name || ""}
                    readOnly
                    onClick={() => setEditingFields(prev => ({ ...prev, responsibleUserId: true }))}
                    onFocus={() => setEditingFields(prev => ({ ...prev, responsibleUserId: true }))}
                  />
                )}
              </div>

              {updateError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
                  {updateError}
                </div>
              )}
            </div>

            {/* Sección: Centro de Costos */}
            <div className="space-y-4">
              <div className="text-sm font-semibold border-b border-[hsl(var(--border))] pb-2">
                Centro de Costos
              </div>

              {/* Agregar nuevo centro de costos */}
              <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <input
                      className="input"
                      placeholder="Código"
                      value={newCostCenter.code}
                      onChange={(e) => setNewCostCenter(prev => ({ ...prev, code: e.target.value }))}
                      disabled={updateLoading}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      className="input"
                      placeholder="Nombre"
                      value={newCostCenter.name}
                      onChange={(e) => setNewCostCenter(prev => ({ ...prev, name: e.target.value }))}
                      disabled={updateLoading}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      className="btn-primary w-full"
                      onClick={handleAddCostCenter}
                      disabled={!newCostCenter.code || !newCostCenter.name || updateLoading}
                    >
                      {updateLoading ? "Agregando..." : "Agregar"}
                    </button>
                  </div>
                </div>
                <div>
                  <input
                    className="input"
                    placeholder="Descripción (opcional)"
                    value={newCostCenter.description}
                    onChange={(e) => setNewCostCenter(prev => ({ ...prev, description: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCostCenter.code && newCostCenter.name && !updateLoading) {
                        handleAddCostCenter();
                      }
                    }}
                    disabled={updateLoading}
                  />
                </div>
              </div>

              {/* Tabla de centros de costos */}
              {loadingCostCenters ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm border border-[hsl(var(--border))] rounded-lg">
                  Cargando centros de costos...
                </div>
              ) : costCenters.length > 0 ? (
                <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[hsl(var(--accent))]">
                        <tr>
                          <th className="px-4 py-3 text-left text-[hsl(var(--accent-foreground))] font-medium">Código</th>
                          <th className="px-4 py-3 text-left text-[hsl(var(--accent-foreground))] font-medium">Nombre</th>
                          <th className="px-4 py-3 text-center text-[hsl(var(--accent-foreground))] font-medium w-24">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costCenters.map((cc) => (
                          <tr key={cc.costCenterId} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                            <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                              {cc.code}
                            </td>
                            <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                              {cc.name}
                            </td>
                            <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-center">
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-700 text-xs font-medium"
                                onClick={() => handleRemoveCostCenter(cc.costCenterId)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm border border-[hsl(var(--border))] rounded-lg">
                  No hay centros de costos registrados
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
