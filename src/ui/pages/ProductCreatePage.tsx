import { useEffect, useState, useMemo, useCallback } from "react";
import { ApiService } from "../../core/api-service";
import type { ProductListItem, UOMItem, CategoryHierarchyItem } from "../../core/api-types";

export default function ProductCreatePage() {
  const [list, setList] = useState<ProductListItem[]>([]);
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState<CategoryHierarchyItem[]>([]);
  const [units, setUnits] = useState<UOMItem[]>([]);

  // Modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    sku: string;
    productName: string;
    categoryId: number | null;
    uomId: number | null;
    isSerialized: boolean;
    isBatchControlled: boolean;
    reorderLevel: string;
    leadTimeDays: string;
    weight: string;
    volume: string;
  }>({
    sku: "",
    productName: "",
    categoryId: null,
    uomId: null,
    isSerialized: false,
    isBatchControlled: false,
    reorderLevel: "",
    leadTimeDays: "",
    weight: "",
    volume: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function numOrNull(v: string) {
    const t = (v ?? "").trim();
    if (t === "") return 0;
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  }

  // Función para aplanar categorías jerárquicas
  const flattenCategories = (categories: CategoryHierarchyItem[]): { id: number; name: string }[] => {
    const result: { id: number; name: string }[] = [];
    categories.forEach(category => {
      result.push({ id: category.categoryId, name: category.categoryName });
      if (category.children && category.children.length > 0) {
        result.push(...flattenCategories(category.children));
      }
    });
    return result;
  };

  // Función para obtener nombre de categoría por ID
  const getCategoryName = useCallback((categoryId: number): string => {
    const findInCategories = (cats: CategoryHierarchyItem[]): string | undefined => {
      for (const cat of cats) {
        if (cat.categoryId === categoryId) return cat.categoryName;
        if (cat.children && cat.children.length > 0) {
          const found = findInCategories(cat.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findInCategories(categories) || '';
  }, [categories]);

  // Función para obtener nombre de unidad por ID
  const getUOMName = useCallback((uomId: number): string => {
    const unit = units.find(u => u.uomId === uomId);
    return unit ? unit.uomName : '';
  }, [units]);

  async function refresh() {
    try {
      const result = await ApiService.getProducts();
      if (result.ok) {
        setList(result.data);
      } else {
        console.error('Error loading products:', result.error);
        setList([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setList([]);
    }
  }

  async function loadCategoriesAndUnits() {
    try {
      // Cargar categorías (sin onlyActive=true para obtener todas)
      const categoriesResult = await ApiService.getCategories();
      if (categoriesResult.ok) {
        setCategories(categoriesResult.data);
      }

      // Cargar unidades de medida
      const unitsResult = await ApiService.getUOMs();
      if (unitsResult.ok) {
        setUnits(unitsResult.data);
      }
    } catch (error) {
      console.error('Error loading categories and units:', error);
    }
  }

  useEffect(() => { 
    refresh(); 
    loadCategoriesAndUnits();
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return list.filter(p => {
      const categoryName = getCategoryName(p.categoryId);
      const uomName = getUOMName(p.uomId);
      return (
        (p.sku ?? "").toLowerCase().includes(t) ||
        (p.productName ?? "").toLowerCase().includes(t) ||
        categoryName.toLowerCase().includes(t) ||
        uomName.toLowerCase().includes(t)
      );
    });
  }, [list, q, getCategoryName, getUOMName]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (!form.categoryId || !form.uomId) {
        setError("Debe seleccionar una categoría y una unidad de medida");
        return;
      }

      if (!form.isSerialized && !form.isBatchControlled) {
        setError("Debe seleccionar un tipo de control (Serializado o Control por lotes)");
        return;
      }

      const result = await ApiService.createProduct({
        sku: form.sku,
        productName: form.productName,
        categoryId: form.categoryId,
        uomId: form.uomId,
        isSerialized: form.isSerialized,
        isBatchControlled: form.isBatchControlled,
        reorderLevel: numOrNull(form.reorderLevel),
        leadTimeDays: numOrNull(form.leadTimeDays),
        weight: numOrNull(form.weight),
        volume: numOrNull(form.volume),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Refresh the list after successful creation
      await refresh();
      setOpen(false);
      setForm({
        sku: "",
        productName: "",
        categoryId: null,
        uomId: null,
        isSerialized: false,
        isBatchControlled: false,
        reorderLevel: "",
        leadTimeDays: "",
        weight: "",
        volume: "",
      });
    } catch (error) {
      console.error('Error creating product:', error);
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Catálogo de Productos</h1>

      {/* Buscador + botón nuevo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          className="input flex-1 min-w-0"
          placeholder="Buscar productos…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-primary w-full sm:w-auto whitespace-nowrap" onClick={() => setOpen(true)}>
          Nuevo producto
        </button>
      </div>

      {/* Tabla de productos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-[hsl(var(--accent))]">
              <tr className="text-left">
                <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">SKU</th>
                <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium min-w-[200px]">Nombre del producto</th>
                <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">Categoría</th>
                <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">Unidad</th>
                <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">Control</th>
                <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">Reorden</th>
                <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">Reposición</th>
                <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">Peso</th>
                <th className="px-4 py-3 text-[hsl(var(--accent-foreground))] font-medium whitespace-nowrap">Volumen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={9}>
                    Sin datos
                  </td>
                </tr>
              )}
              {filtered.map((p: ProductListItem) => (
                <tr key={p.productId} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                  <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))] whitespace-nowrap font-medium">{p.sku}</td>
                  <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--foreground))]">{p.productName}</td>
                  <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{getCategoryName(p.categoryId)}</td>
                  <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{getUOMName(p.uomId)}</td>
                  <td className="px-4 py-3 border-b border-[hsl(var(--border))] whitespace-nowrap">
                    {p.isSerialized ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Serializado
                      </span>
                    ) : p.isBatchControlled ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Por lotes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Ninguno
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{p.reorderLevel ?? "-"}</td>
                  <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{p.leadTimeDays ?? "-"}</td>
                  <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{p.weight ?? "-"}</td>
                  <td className="px-4 py-3 border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{p.volume ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nuevo producto */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="card-inner">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6">Nuevo producto</h2>
              <form className="space-y-4" onSubmit={submit}>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-[var(--radius)] border border-red-200">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">SKU</label>
                    <input 
                      className="input" 
                      value={form.sku} 
                      onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Nombre del producto</label>
                    <input 
                      className="input" 
                      value={form.productName} 
                      onChange={(e) => setForm(f => ({ ...f, productName: e.target.value }))} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Categoría</label>
                    <select 
                      className="input" 
                      value={form.categoryId ?? ""} 
                      onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value ? Number(e.target.value) : null }))}
                      required
                    >
                      <option value="">Seleccione una categoría</option>
                      {flattenCategories(categories).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Unidad de medida</label>
                    <select 
                      className="input" 
                      value={form.uomId ?? ""} 
                      onChange={(e) => setForm(f => ({ ...f, uomId: e.target.value ? Number(e.target.value) : null }))}
                      required
                    >
                      <option value="">Seleccione una unidad</option>
                      {units.map(unit => (
                        <option key={unit.uomId} value={unit.uomId}>{unit.uomName}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Switches exclusivos */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-3">Tipo de control</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="controlType" 
                          checked={form.isSerialized && !form.isBatchControlled}
                          onChange={() => setForm(f => ({ ...f, isSerialized: true, isBatchControlled: false }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">Serializado</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="controlType" 
                          checked={form.isBatchControlled && !form.isSerialized}
                          onChange={() => setForm(f => ({ ...f, isSerialized: false, isBatchControlled: true }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">Control por lotes</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Nivel de reorden</label>
                    <input 
                      className="input" 
                      type="number" 
                      min="0" 
                      step="1" 
                      value={form.reorderLevel} 
                      onChange={(e) => setForm(f => ({ ...f, reorderLevel: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Tiempo de reposición (días)</label>
                    <input 
                      className="input" 
                      type="number" 
                      min="0" 
                      step="1" 
                      value={form.leadTimeDays} 
                      onChange={(e) => setForm(f => ({ ...f, leadTimeDays: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Peso</label>
                    <input 
                      className="input" 
                      type="number" 
                      min="0" 
                      step="0.0001" 
                      value={form.weight} 
                      onChange={(e) => setForm(f => ({ ...f, weight: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Volumen</label>
                    <input 
                      className="input" 
                      type="number" 
                      min="0" 
                      step="0.0001" 
                      value={form.volume} 
                      onChange={(e) => setForm(f => ({ ...f, volume: e.target.value }))} 
                    />
                  </div>
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
