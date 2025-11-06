import { useEffect, useMemo, useState } from "react";
import { container } from "../../app/di";

type BranchLite = { id: string; name: string };
type WarehouseLite = { branchId: string; code: string; name: string };

type Product = {
  SKU?: string;
  ProductName: string;
  CategoryID?: string;
  UOMID?: string;
  IsSerialized: boolean;
  IsBatchControlled: boolean;
  ReorderLevel?: number;
  LeadTimeDays?: number;
  Weight?: number;
  Volume?: number;
};

type InventoryRow = Product & {
  quantity: number;            // columna editable
  SKU: string;                 // normalizamos a string no-null para la tabla/clave
};

export default function InventoryPage() {
  const branchRepo = container.branchRepo;
  const warehouseRepo = container.warehouseRepo;
  const productRepo = container.productRepo;
  const inventoryRepo = container.inventoryRepo;

  const [branches, setBranches] = useState<BranchLite[]>([]);
  const [branchId, setBranchId] = useState<string>("");

  const [warehouses, setWarehouses] = useState<WarehouseLite[]>([]);
  const [warehouseCode, setWarehouseCode] = useState<string>("");

  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [q, setQ] = useState("");

  // Mini-modal: agregar producto
  const [openAdd, setOpenAdd] = useState(false);
  const [addSku, setAddSku] = useState<string>("");
  const [addQty, setAddQty] = useState<string>("");

  // Cargar sucursales al inicio
  useEffect(() => {
    (async () => {
      const bs: BranchLite[] = (await branchRepo.list?.()) ?? [];
      setBranches(bs);
      if (bs.length) setBranchId(String(bs[0].id));
    })();
  }, [branchRepo]);

  // Cargar almacenes cuando cambie sucursal
  useEffect(() => {
    (async () => {
      if (!branchId) { setWarehouses([]); setWarehouseCode(""); return; }
      const ws: WarehouseLite[] = (await warehouseRepo.listByBranch?.(branchId)) ?? [];
      setWarehouses(ws);
      setWarehouseCode(ws.length ? String(ws[0].code) : "");
    })();
  }, [warehouseRepo, branchId]);

  // Cargar productos (para la tabla y el modal)
  useEffect(() => {
    (async () => {
      const ps: Product[] = (await productRepo.list?.()) ?? [];
      // normaliza booleanos/nullables por si vienen undefined
      const norm = ps.map(p => ({
        SKU: p.SKU ?? undefined,
        ProductName: p.ProductName ?? "",
        CategoryID: p.CategoryID ?? undefined,
        UOMID: p.UOMID ?? undefined,
        IsSerialized: !!p.IsSerialized,
        IsBatchControlled: !!p.IsBatchControlled,
        ReorderLevel: p.ReorderLevel ?? undefined,
        LeadTimeDays: p.LeadTimeDays ?? undefined,
        Weight: p.Weight ?? undefined,
        Volume: p.Volume ?? undefined,
      }));
      setProducts(norm);
    })();
  }, [productRepo]);

  // Cargar inventario cuando haya sucursal + almacén
  useEffect(() => {
    (async () => {
      if (!branchId || !warehouseCode) { setRows([]); return; }
      const data = (await inventoryRepo.listByLocation?.(branchId, warehouseCode)) ?? [];
      // Si el backend ya trae todos los campos del producto, usamos tal cual.
      // Si solo trae SKU+quantity, completamos desde 'products'.
      const rowsFilled: InventoryRow[] = data.map((r) => {
        const sku = String(r.SKU ?? "");
        const p = products.find(pp => (pp.SKU ?? "") === sku);
        const base: Product = p ?? {
          SKU: sku,
          ProductName: "",
          CategoryID: undefined,
          UOMID: undefined,
          IsSerialized: false,
          IsBatchControlled: false,
          ReorderLevel: undefined,
          LeadTimeDays: undefined,
          Weight: undefined,
          Volume: undefined,
        };
        return {
          ...base,
          SKU: sku,
          quantity: Number(r.quantity ?? 0),
        };
      });
      setRows(rowsFilled);
    })();
  }, [inventoryRepo, branchId, warehouseCode, products]);

  // Filtro por buscador
  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return rows.filter(r =>
      r.SKU.toLowerCase().includes(t) ||
      (r.ProductName ?? "").toLowerCase().includes(t) ||
      (r.CategoryID ?? "").toLowerCase().includes(t) ||
      (r.UOMID ?? "").toLowerCase().includes(t)
    );
  }, [rows, q]);

  // Cambiar cantidad en memoria
  function setQty(sku: string, val: string) {
    setRows(prev =>
      prev.map(r => (r.SKU === sku ? { ...r, quantity: Number(val || 0) } : r))
    );
  }

  // Guardar cantidades
  async function saveAll() {
    if (!branchId || !warehouseCode) return;
    const items = rows.map(r => ({ SKU: r.SKU, quantity: r.quantity }));
    await inventoryRepo.saveQuantities?.(branchId, warehouseCode, items);
    // opcional: refrescar
    const data = (await inventoryRepo.listByLocation?.(branchId, warehouseCode)) ?? [];
    const refreshed: InventoryRow[] = data.map((r) => {
      const sku = String(r.SKU ?? "");
      const p = products.find(pp => (pp.SKU ?? "") === sku);
      const base: Product = p ?? {
        SKU: sku,
        ProductName: "",
        CategoryID: undefined,
        UOMID: undefined,
        IsSerialized: false,
        IsBatchControlled: false,
        ReorderLevel: undefined,
        LeadTimeDays: undefined,
        Weight: undefined,
        Volume: undefined,
      };
      return { ...base, SKU: sku, quantity: Number(r.quantity ?? 0) };
    });
    setRows(refreshed);
  }

  // Opciones de productos para el modal (excluye los ya listados)
  const productOptions = useMemo(() => {
    const existing = new Set(rows.map(r => r.SKU));
    return products.filter(p => !existing.has(p.SKU ?? "")).map(p => ({
      value: p.SKU ?? "",
      label: `${p.SKU ?? "SN"} — ${p.ProductName}`,
      product: p,
    }));
  }, [products, rows]);

  function openAddModal() {
    setAddSku(productOptions[0]?.value ?? "");
    setAddQty("");
    setOpenAdd(true);
  }

  function addProductToList(e: React.FormEvent) {
    e.preventDefault();
    const opt = productOptions.find(o => o.value === addSku);
    if (!opt) return;
    const p = opt.product;
    const newRow: InventoryRow = {
      SKU: p.SKU ?? "",
      ProductName: p.ProductName,
      CategoryID: p.CategoryID,
      UOMID: p.UOMID,
      IsSerialized: !!p.IsSerialized,
      IsBatchControlled: !!p.IsBatchControlled,
      ReorderLevel: p.ReorderLevel,
      LeadTimeDays: p.LeadTimeDays,
      Weight: p.Weight,
      Volume: p.Volume,
      quantity: Number(addQty || 0),
    };
    setRows(prev => [...prev, newRow]);
    setOpenAdd(false);
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      {/* Título */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">Inventario</h1>

      {/* Selectores: Sucursal y Almacén (en línea) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <select className="select w-full sm:w-64" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {branches.map(b => (
            <option key={String(b.id)} value={String(b.id)}>{b.name}</option>
          ))}
        </select>

        <select className="select w-full sm:w-64" value={warehouseCode} onChange={(e) => setWarehouseCode(e.target.value)}>
          <option value="">Todos los almacenes</option>
          {warehouses.map(w => (
            <option key={`${w.branchId}:${w.code}`} value={String(w.code)}>{w.name || w.code}</option>
          ))}
        </select>
      </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-4">
        <input
          className="input flex-1 min-w-0"
          placeholder="Buscar productos…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Acciones cerca de la tabla */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
        <button className="btn w-full sm:w-auto" onClick={openAddModal}>Agregar producto</button>
        <button className="btn-primary w-full sm:w-auto whitespace-nowrap" onClick={saveAll}>Guardar</button>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle sm:px-0 px-4">
            <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--accent))]">
              <tr className="text-left">
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">SKU</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Nombre</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Categoría</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Unidad</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Serializado</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Control por lotes</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Nivel de reorden</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Tiempo de reposición (días)</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Peso</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium">Volumen</th>
                <th className="px-6 py-4 text-[hsl(var(--accent-foreground))] font-medium w-40">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]" colSpan={11}>
                    Sin datos
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.SKU} className="hover:bg-[hsl(var(--accent))]/50 transition-colors">
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.SKU}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.ProductName}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.CategoryID ?? ""}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.UOMID ?? ""}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.IsSerialized ? "Sí" : "No"}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.IsBatchControlled ? "Sí" : "No"}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.ReorderLevel ?? ""}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.LeadTimeDays ?? ""}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.Weight ?? ""}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">{r.Volume ?? ""}</td>
                  <td className="px-6 py-4 border-b border-[hsl(var(--border))]">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="1"
                      value={Number.isFinite(r.quantity) ? String(r.quantity) : ""}
                      onChange={(e) => setQty(r.SKU, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Mini-modal: Agregar producto */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="card-inner">
              <h2 className="text-xl font-semibold mb-4">Agregar producto</h2>
              <form className="space-y-4" onSubmit={addProductToList}>
                <div>
                  <label className="block text-sm font-medium mb-2">Producto</label>
                  <select
                    className="select w-full"
                    value={addSku}
                    onChange={(e) => setAddSku(e.target.value)}
                    required
                  >
                    {productOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cantidad</label>
                  <input
                    className="input w-full"
                    type="number"
                    min="0"
                    step="1"
                    value={addQty}
                    onChange={(e) => setAddQty(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" className="btn" onClick={() => setOpenAdd(false)}>Cancelar</button>
                  <button className="btn-primary" type="submit">Agregar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
