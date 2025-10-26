import React, { useEffect, useState, useMemo, useCallback } from "react";
import { ApiService } from "../../core/api-service";
import type { CategoryHierarchyItem, CategoryListItem } from "../../core/api-types";

export default function CategoryCreatePage() {

  const [hierarchy, setHierarchy] = useState<CategoryHierarchyItem[]>([]);
  const [q, setQ] = useState("");

  // Modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ categoryName: string; description: string; parentCategoryId: number | null }>({
    categoryName: "",
    description: "",
    parentCategoryId: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Drag & Drop
  const [draggedItem, setDraggedItem] = useState<CategoryHierarchyItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  
  // Expand/Collapse
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Obtiene todas las categorías desde la API real
    (async () => {
      try {
        const result = await ApiService.getCategories();
        if (result.ok) {
          setHierarchy(result.data);
        } else {
          console.error('Error loading categories:', result.error);
          setHierarchy([]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setHierarchy([]);
      }
    })();
  }, []);

  // Función para encontrar el nombre de una categoría por ID
  const findCategoryNameById = useCallback((id: number, categories: CategoryHierarchyItem[]): string | undefined => {
    for (const category of categories) {
      if (category.categoryId === id) return category.categoryName;
      if (category.children) {
        const found = findCategoryNameById(id, category.children);
        if (found) return found;
      }
    }
    return undefined;
  }, []);

  // Función para aplanar la estructura jerárquica
  const flattenCategories = useCallback((categories: CategoryHierarchyItem[], level = 0): CategoryListItem[] => {
    const result: CategoryListItem[] = [];
    categories.forEach(category => {
      result.push({
        ...category,
        parentCategoryName: category.parentCategoryId 
          ? findCategoryNameById(category.parentCategoryId, hierarchy) 
          : undefined
      });
      if (category.children && category.children.length > 0) {
        result.push(...flattenCategories(category.children, level + 1));
      }
    });
    return result;
  }, [hierarchy, findCategoryNameById]);

  // Lista aplanada para búsqueda
  const flatList = useMemo(() => flattenCategories(hierarchy), [hierarchy, flattenCategories]);

  const filtered = flatList.filter((c) => {
    const t = (q || "").toLowerCase();
    return (
      (c.categoryName ?? "").toLowerCase().includes(t) ||
      (c.description ?? "").toLowerCase().includes(t) ||
      (c.parentCategoryName ?? "").toLowerCase().includes(t)
    );
  });

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const result = await ApiService.createCategory({
        categoryName: form.categoryName,
        description: form.description,
        parentCategoryId: form.parentCategoryId,
        isActive: true,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Refresh the list after successful creation
      const refreshResult = await ApiService.getCategories();
      if (refreshResult.ok) {
        setHierarchy(refreshResult.data);
      }
      setOpen(false);
      setForm({ categoryName: "", description: "", parentCategoryId: null });
    } catch (error) {
      console.error('Error creating category:', error);
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c: CategoryListItem) {
    // Abre el mismo modal precargado
    setForm({
      categoryName: c.categoryName ?? "",
      description: c.description ?? "",
      parentCategoryId: c.parentCategoryId,
    });
    setOpen(true);
  }

  async function remove(id: string) {
    try {
      // TODO: Implementar endpoint de eliminación cuando esté disponible
      console.log('Delete category:', id);
      // Por ahora solo refrescamos la lista
      const refreshResult = await ApiService.getCategories();
      if (refreshResult.ok) {
        setHierarchy(refreshResult.data);
      }
    } catch {
      // Silencioso
    }
  }

  // Funciones de Drag & Drop
  const handleDragStart = (e: React.DragEvent, category: CategoryHierarchyItem) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(categoryId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: number) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem.categoryId === targetCategoryId) {
      setDraggedItem(null);
      return;
    }

    try {
      const result = await ApiService.changeCategoryParent(draggedItem.categoryId, targetCategoryId);
      if (result.ok) {
        // Refresh the hierarchy after successful change
        const refreshResult = await ApiService.getCategories();
        if (refreshResult.ok) {
          setHierarchy(refreshResult.data);
        }
      } else {
        console.error('Error changing parent:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Error changing parent:', error);
      setError("Error inesperado al cambiar padre de categoría.");
    } finally {
      setDraggedItem(null);
    }
  };

  const handleDropOnRoot = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem) return;

    try {
      const result = await ApiService.changeCategoryParent(draggedItem.categoryId, null);
      if (result.ok) {
        // Refresh the hierarchy after successful change
        const refreshResult = await ApiService.getCategories();
        if (refreshResult.ok) {
          setHierarchy(refreshResult.data);
        }
      } else {
        console.error('Error changing parent:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Error changing parent:', error);
      setError("Error inesperado al cambiar padre de categoría.");
    } finally {
      setDraggedItem(null);
    }
  };

  // Funciones para expand/collapse
  const toggleExpanded = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isExpanded = (categoryId: number) => expandedCategories.has(categoryId);

  // Componente para renderizar categorías jerárquicamente
  const renderCategoryItem = (category: CategoryHierarchyItem, level = 0) => {
    const isDragged = draggedItem?.categoryId === category.categoryId;
    const isDragOver = dragOverItem === category.categoryId;
    const hasChildren = category.children && category.children.length > 0;
    const expanded = isExpanded(category.categoryId);
    
    return (
      <div key={category.categoryId} className="relative">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, category)}
          onDragOver={(e) => handleDragOver(e, category.categoryId)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, category.categoryId)}
          className={`
            group relative p-4 m-2 rounded-xl border-2 border-dashed transition-all duration-300 cursor-move
            ${isDragged ? 'opacity-50 bg-blue-50 border-blue-400 shadow-lg' : ''}
            ${isDragOver ? 'bg-green-50 border-green-400 scale-105 shadow-lg' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}
            ${level > 0 ? `ml-${level * 6}` : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Botón de expand/collapse */}
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(category.categoryId)}
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              {!hasChildren && <div className="w-6 h-6"></div>}
              
              {/* Icono de categoría */}
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                {category.categoryName.charAt(0).toUpperCase()}
              </div>
              
              {/* Información de la categoría */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] text-lg">{category.categoryName}</h3>
                  {category.parentCategoryId && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))] bg-gray-100 px-2 py-1 rounded-full">
                      Hijo de: {findCategoryNameById(category.parentCategoryId, hierarchy)}
                    </span>
                  )}
                  {hasChildren && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {category.children.length} hijo{category.children.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{category.description}</p>
              </div>
            </div>
            
            {/* Botones de acción (comentados temporalmente) */}
            <div className="flex items-center gap-2">
              {/* <button 
                className="btn text-xs px-3 py-1" 
                onClick={() => startEdit(category)}
              >
                Editar
              </button>
              <button 
                className="btn text-xs px-3 py-1 text-red-600 border-red-200 hover:bg-red-50" 
                onClick={() => remove(String(category.categoryId))}
              >
                Eliminar
              </button> */}
            </div>
          </div>
          
          {/* Área de drop para hacer esta categoría padre */}
          <div 
            className="mt-3 p-3 text-xs text-center text-[hsl(var(--muted-foreground))] border-t border-gray-100 bg-gray-50 rounded-lg"
            onDragOver={(e) => handleDragOver(e, category.categoryId)}
            onDrop={(e) => handleDrop(e, category.categoryId)}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Arrastra aquí para hacer esta categoría padre
            </div>
          </div>
        </div>
        
        {/* Renderizar hijos solo si está expandido */}
        {hasChildren && expanded && (
          <div className="ml-6 mt-2 space-y-2">
            {category.children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Categorías</h1>

      {/* Buscador + botón crear */}
      <div className="flex items-center gap-4">
        <input
          className="input flex-1"
          placeholder="Buscar categoría…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button 
          className="btn-primary" 
          onClick={() => { setForm({ categoryName: "", description: "", parentCategoryId: null }); setOpen(true); }}
        >
          Nueva categoría
        </button>
      </div>

      {/* Área de drop para categorías raíz */}
      <div 
        className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleDropOnRoot}
      >
        <p className="text-[hsl(var(--muted-foreground))]">
          Arrastra categorías aquí para convertirlas en categorías raíz (sin padre)
        </p>
      </div>

      {/* Lista jerárquica de categorías */}
      <div className="space-y-2">
        {hierarchy.length === 0 && (
          <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
            Sin categorías
          </div>
        )}
        {hierarchy.map(category => renderCategoryItem(category))}
      </div>

      {/* Tabla de búsqueda (cuando hay filtro) */}
      {q && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <h3 className="font-semibold text-[hsl(var(--foreground))]">Resultados de búsqueda</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--accent))]">
                <tr className="text-left">
                  <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Nombre</th>
                  <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Descripción</th>
                  <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">ID Padre</th>
                  <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Nombre Padre</th>
                  <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium w-40">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={5}>
                      Sin resultados
                    </td>
                  </tr>
                )}
                {filtered.map((c) => (
                  <tr key={String(c.categoryId)} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                    <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                      {c.categoryName}
                    </td>
                    <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                      {c.description}
                    </td>
                    <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                      {c.parentCategoryId ?? ""}
                    </td>
                    <td className="px-6 py-4 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                      {c.parentCategoryName ?? ""}
                    </td>
                    <td className="px-6 py-4 border-b border-[hsl(var(--border))]">
                      <div className="flex items-center gap-2">
                        <button 
                          className="btn text-xs px-3 py-1" 
                          onClick={() => startEdit(c)}
                        >
                          Editar
                        </button>
                        <button 
                          className="btn text-xs px-3 py-1 text-red-600 border-red-200 hover:bg-red-50" 
                          onClick={() => remove(String(c.categoryId))}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nueva categoría */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 rounded-3xl backdrop-blur-sm">
          <div className="card w-full max-w-lg mx-4">
            <div className="card-inner">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6">Nueva categoría</h2>
              <form className="space-y-4" onSubmit={submitNew}>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Nombre de la categoría
                  </label>
                  <input
                    className="input"
                    value={form.categoryName}
                    onChange={(e) => setForm((f) => ({ ...f, categoryName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Descripción
                  </label>
                  <input
                    className="input"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Categoría padre
                  </label>
                  <select
                    className="input"
                    value={form.parentCategoryId ?? ""}
                    onChange={(e) => setForm((f) => ({ 
                      ...f, 
                      parentCategoryId: e.target.value === "" ? null : Number(e.target.value) 
                    }))}
                  >
                    <option value="">Sin categoría padre</option>
                    {flatList.map((category) => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
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
